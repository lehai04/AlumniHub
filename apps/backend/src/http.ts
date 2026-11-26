import { createServer, type IncomingMessage } from "node:http";
import type { applicationStore } from "./applications.ts";
import { careerId, type careerStore } from "./career.ts";
import { type communityStore, isCommunitySection } from "./community.ts";
import type { AppConfig } from "./config.ts";
import { eventWorkbook } from "./event-workbook.ts";
import { ApiError, type eventStore } from "./events.ts";
import {
  type homepageStore,
  type ItemKind,
  isHomepageImage,
} from "./homepage.ts";
import {
  createSessions,
  type LocalPasswords,
  matchesPassword,
  type StaffPasswords,
} from "./local-session.ts";
import type { createLogger } from "./logger.ts";
import type { newsStore } from "./news.ts";
import type { passwordResetStore } from "./password-reset.ts";
import type { serviceContentStore } from "./service-content.ts";

async function readBody(request: IncomingMessage, limit: number) {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) {
      request.resume();
      throw new ApiError(413, "request_too_large");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(
  request: IncomingMessage,
  limit = 32768,
): Promise<Record<string, unknown>> {
  if (request.headers["content-type"]?.split(";")[0] !== "application/json")
    throw new ApiError(415, "json_required");
  const data = await readBody(request, limit);
  try {
    const json = JSON.parse(data.toString("utf8"));
    if (!json || typeof json !== "object" || Array.isArray(json))
      throw new Error();
    return json;
  } catch {
    throw new ApiError(400, "invalid_json");
  }
}

async function readPdf(request: IncomingMessage) {
  if (request.headers["content-type"]?.split(";")[0] !== "application/pdf")
    throw new ApiError(415, "pdf_required");
  const header = request.headers["x-cv-name"];
  let name = "";
  try {
    if (typeof header === "string") name = decodeURIComponent(header).trim();
  } catch {}
  if (!name || name.length > 120 || /\p{Cc}/u.test(name))
    throw new ApiError(400, "invalid_cv_name");
  const data = await readBody(request, 5 * 1024 * 1024);
  if (
    data.subarray(0, 5).toString() !== "%PDF-" ||
    !data.subarray(-1024).toString().includes("%%EOF")
  )
    throw new ApiError(415, "pdf_required");
  return { name, data };
}

export function createHttpServer(
  release: Pick<AppConfig, "version" | "commit">,
  isReady: () => Promise<boolean>,
  log: ReturnType<typeof createLogger>,
  events: ReturnType<typeof eventStore>,
  devPasswords?: LocalPasswords,
  applications?: ReturnType<typeof applicationStore>,
  news?: ReturnType<typeof newsStore>,
  career?: ReturnType<typeof careerStore>,
  community?: ReturnType<typeof communityStore>,
  passwordReset?: ReturnType<typeof passwordResetStore>,
  serviceContent?: ReturnType<typeof serviceContentStore>,
  homepage?: (
    page?: string,
    item?: ItemKind,
  ) => ReturnType<typeof homepageStore>,
  auth: { staffPasswords?: StaffPasswords; secureCookies?: boolean } = {},
) {
  const staffPasswords = auth.staffPasswords ?? devPasswords;
  const sessions = createSessions(
    "alumni_session",
    Boolean(auth.secureCookies),
  );
  const staffSessions = createSessions(
    "alumni_staff_session",
    Boolean(auth.secureCookies),
  );
  const loginWindows = {
    staff: { started: 0, count: 0, limit: 40 },
    alumni: { started: 0, count: 0, limit: 120 },
  };
  function limitLogin(portal: keyof typeof loginWindows) {
    const window = loginWindows[portal];
    const now = Date.now();
    if (now - window.started >= 60_000) {
      window.started = now;
      window.count = 0;
    }
    if (window.count >= window.limit)
      throw new ApiError(429, "login_rate_limited");
    window.count += 1;
  }
  return createServer({ requestTimeout: 15000 }, async (request, response) => {
    const path = request.url?.split("?")[0];
    const method = request.method;
    const cookie = request.headers.cookie;
    const send = (status: number, content: unknown) => {
      response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(JSON.stringify(content));
      log(status >= 500 ? "warn" : "debug", "http_request", { status });
    };
    const currentAccount = async () => {
      const account = sessions.read(cookie);
      if (account?.role !== "applicant") return account;
      const profile = await applications?.own(account.id);
      if (!profile) return null;
      return {
        ...account,
        role: profile.code ? ("alumni" as const) : ("applicant" as const),
      };
    };
    const requireRole = async (role: "admin" | "alumni" | "reviewer") => {
      const account =
        role === "alumni" ? await currentAccount() : staffSessions.read(cookie);
      if (!account) {
        const other = role === "alumni" ? staffSessions : sessions;
        if (other.read(cookie)) throw new ApiError(403, "forbidden");
        throw new ApiError(401, "authentication_required");
      }
      if (account.role !== role) throw new ApiError(403, "forbidden");
      return account;
    };

    try {
      const homeRoute = path?.match(
        /^\/api\/(admin\/)?homepage(?:\/(publish|images\/(hero|event|career[1-4])))?$/,
      );
      const pageRoute = path?.match(
        /^\/api\/(admin\/)?pages\/(news|events|services|career|community|alumni-card)(?:\/(publish|image))?$/,
      );
      const itemRoute = path?.match(
        /^\/api\/(admin\/)?(news|events)-content\/([a-z0-9-]{1,80})(?:\/(publish|image))?$/,
      );
      const item = itemRoute?.[2];
      if (homepage && (homeRoute || pageRoute || itemRoute)) {
        const content = homepage(
          pageRoute?.[2] ?? itemRoute?.[3],
          item === "news" || item === "events" ? item : undefined,
        );
        const admin = Boolean((homeRoute ?? pageRoute ?? itemRoute)?.[1]);
        const action = homeRoute?.[2] ?? pageRoute?.[3] ?? itemRoute?.[4];
        const slot =
          homeRoute?.[3] ?? (action === "image" ? "hero" : undefined);
        if (admin) await requireRole("admin");
        if (!action && method === "GET")
          return send(200, await content.read(admin));
        if (!action && admin && method === "PATCH") {
          return send(
            200,
            await content.save(await readJson(request, 128 * 1024)),
          );
        }
        if (action === "publish" && admin && method === "POST")
          return send(
            200,
            await content.publish((await readJson(request)).revision),
          );
        if (
          isHomepageImage(slot) &&
          admin &&
          (method === "PUT" || method === "DELETE")
        ) {
          const type = request.headers["content-type"] ?? "";
          const revision = new URL(
            request.url ?? "",
            "http://localhost",
          ).searchParams.get("revision");
          const version = revision === null ? null : Number(revision);
          if (method === "DELETE")
            return send(200, await content.removeImage(slot, version));
          return send(
            200,
            await content.writeImage(
              slot,
              type,
              await readBody(request, 2 * 1024 * 1024),
              version,
            ),
          );
        }
        if (isHomepageImage(slot) && method === "GET") {
          const image = await content.image(slot, admin);
          response.writeHead(200, {
            "Content-Type": image.type,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          });
          response.end(image.bytes);
          return;
        }
      }
      if (passwordReset && method === "POST") {
        if (path === "/api/password-reset/request") {
          await passwordReset.request((await readJson(request)).email);
          return send(202, { accepted: true });
        }
        if (path === "/api/password-reset/complete") {
          sessions.revokeAccount(
            await passwordReset.complete(await readJson(request)),
          );
          return send(200, { changed: true });
        }
        if (path === "/api/local/mailbox") {
          await requireRole("admin");
          const message = passwordReset.message(
            (await readJson(request)).email,
          );
          if (!message) throw new ApiError(404, "mail_not_found");
          return send(200, message);
        }
      }
      if (serviceContent && method === "GET" && path === "/api/services")
        return send(200, await serviceContent.list(true));
      if (serviceContent && path === "/api/admin/services") {
        if (method === "GET") {
          const account = staffSessions.read(cookie);
          if (!account) {
            if (sessions.read(cookie)) throw new ApiError(403, "forbidden");
            throw new ApiError(401, "authentication_required");
          }
          if (account.role !== "admin" && account.role !== "reviewer")
            throw new ApiError(403, "forbidden");
          return send(200, await serviceContent.list(false));
        }
        if (method === "POST") {
          await requireRole("admin");
          return send(
            201,
            await serviceContent.save(undefined, await readJson(request)),
          );
        }
      }
      const service = path?.match(
        /^\/api\/admin\/services\/([^/]+)(?:\/(submit|return|publish|withdraw))?$/,
      );
      if (serviceContent && service && careerId.test(service[1])) {
        const [, id, action] = service;
        if (method === "PATCH" && !action) {
          await requireRole("admin");
          return send(
            200,
            await serviceContent.save(id, await readJson(request)),
          );
        }
        if (
          method === "POST" &&
          (action === "submit" ||
            action === "return" ||
            action === "publish" ||
            action === "withdraw")
        ) {
          await requireRole(action === "submit" ? "admin" : "reviewer");
          return send(
            200,
            await serviceContent.transition(
              id,
              action,
              (await readJson(request)).revision,
            ),
          );
        }
      }
      const publicCommunity = path?.match(
        /^\/api\/community\/(board|roles|posts|collaborations)$/,
      );
      if (community && publicCommunity) {
        const { id: account } = await requireRole("alumni");
        if (!careerId.test(account)) throw new ApiError(403, "forbidden");
        const section = publicCommunity[1];
        if (section === "board" && method === "GET")
          return send(200, await community.board());
        if (isCommunitySection(section)) {
          if (method === "GET")
            return send(200, await community.mine(section, account));
          if (method === "POST")
            return send(
              201,
              await community.submit(section, account, await readJson(request)),
            );
        }
      }
      const adminCommunity = path?.match(
        /^\/api\/admin\/community\/(roles|posts|collaborations)(?:\/([a-f0-9-]{36}))?$/,
      );
      if (community && adminCommunity) {
        const reviewer = await requireRole("admin");
        const [, section, id] = adminCommunity;
        if (isCommunitySection(section)) {
          if (!id && method === "GET")
            return send(200, await community.list(section));
          if (id && careerId.test(id) && method === "PATCH")
            return send(
              200,
              await community.process(
                section,
                id,
                reviewer.id,
                await readJson(request),
              ),
            );
        }
      }
      if (career && path?.startsWith("/api/career/")) {
        const { id: account } = await requireRole("alumni");
        if (!careerId.test(account)) throw new ApiError(403, "forbidden");
        const route = path.slice("/api/career/".length).split("/");
        if (route.length > 3 || route.some((part) => !part))
          return send(404, { error: "not_found" });
        const [resource, id, action] = route;
        const sendPdf = (
          pdf: { name: string; data: Buffer },
          inline = false,
        ) => {
          const name = pdf.name.replace(/\.pdf$/i, "");
          const encoded = encodeURIComponent(`${name}.pdf`).replace(
            /'/g,
            "%27",
          );
          response.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Length": pdf.data.length,
            "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="CV.pdf"; filename*=UTF-8''${encoded}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; sandbox",
          });
          response.end(pdf.data);
        };
        if (resource === "profile" && !id) {
          if (method === "GET") return send(200, await career.profile(account));
          if (method === "PATCH")
            return send(
              200,
              await career.saveProfile(
                account,
                await readJson(request, 128 * 1024),
              ),
            );
        }
        if (!id && method === "GET") {
          if (resource === "candidates")
            return send(200, await career.candidates(account));
          if (resource === "jobs")
            return send(
              200,
              await career.jobs(
                new URLSearchParams(request.url?.split("?")[1]),
              ),
            );
          if (resource === "own-jobs")
            return send(200, await career.ownJobs(account));
          if (resource === "cvs") return send(200, await career.cvs(account));
          if (resource === "applications")
            return send(200, await career.history(account));
        }
        if (!id && method === "POST") {
          if (resource === "own-jobs")
            return send(
              201,
              await career.createJob(account, await readJson(request)),
            );
          if (resource === "cvs")
            return send(
              201,
              await career.addCv(account, await readPdf(request)),
            );
        }
        if (id && careerId.test(id)) {
          if (resource === "candidates" && !action && method === "GET") {
            const [candidate] = await career.candidates(account, id);
            if (!candidate) throw new ApiError(404, "candidate_not_found");
            return send(200, candidate);
          }
          if (resource === "jobs") {
            if (method === "GET" && !action)
              return send(200, await career.job(id, account));
            if (method === "POST" && action === "apply") {
              const { cvId } = await readJson(request);
              return send(201, await career.apply(account, id, cvId));
            }
          }
          if (resource === "own-jobs") {
            if (method === "PATCH" && !action)
              return send(
                200,
                await career.updateJob(account, id, await readJson(request)),
              );
            if (method === "GET" && action === "applications")
              return send(200, await career.jobApplications(account, id));
            if (
              method === "POST" &&
              (action === "publish" || action === "close")
            ) {
              await readJson(request);
              return send(200, await career.changeJob(account, id, action));
            }
          }
          if (resource === "cvs" && !action) {
            if (method === "GET")
              return sendPdf(
                await career.ownCv(account, id),
                new URLSearchParams(request.url?.split("?")[1]).get(
                  "inline",
                ) === "1",
              );
            if (method === "DELETE") {
              await readJson(request);
              return send(200, await career.deleteCv(account, id));
            }
            if (method === "PATCH")
              return send(
                200,
                await career.updateCv(
                  account,
                  id,
                  (await readJson(request)).name,
                ),
              );
            if (method === "PUT") {
              const pdf = await readPdf(request);
              return send(
                200,
                await career.updateCv(account, id, pdf.name, pdf.data),
              );
            }
          }
          if (
            resource === "applications" &&
            action === "cv" &&
            method === "GET"
          )
            return sendPdf(await career.applicationCv(account, id));
        }
        return send(404, { error: "not_found" });
      }
      if (method === "GET" && path === "/health")
        return send(200, {
          status: "ok",
          version: release.version,
          commit: release.commit,
        });
      if (method === "GET" && path === "/ready") {
        const ready = await isReady().catch(() => {
          log("warn", "database_not_ready");
          return false;
        });
        return send(ready ? 200 : 503, {
          status: ready ? "ready" : "unavailable",
        });
      }
      if (path === "/api/admin/session") {
        if (method === "GET")
          return send(200, {
            account: staffSessions.read(cookie),
            loginEnabled: Boolean(staffPasswords),
            passwordResetEnabled: Boolean(passwordReset),
          });
        if (method === "POST") {
          if (!staffPasswords) throw new ApiError(403, "staff_login_disabled");
          const { username, password } = await readJson(request);
          limitLogin("staff");
          if (
            (username !== "admin" && username !== "reviewer") ||
            !matchesPassword(password, staffPasswords[username])
          )
            throw new ApiError(401, "invalid_credentials");
          const id = auth.secureCookies
            ? `staff:${username}`
            : `local:${username}`;
          const session = staffSessions.issue({ id, role: username }, cookie);
          response.setHeader("Set-Cookie", session.cookie);
          return send(200, { account: session.account });
        }
        if (method === "DELETE") {
          await readJson(request);
          response.setHeader("Set-Cookie", staffSessions.clear(cookie));
          return send(200, { account: null });
        }
      }
      if (method === "GET" && path === "/api/session")
        return send(200, {
          account: await currentAccount(),
          localLogin: Boolean(devPasswords),
          passwordResetEnabled: Boolean(passwordReset),
          registrationEnabled: Boolean(applications),
        });
      if (method === "POST" && path === "/api/session") {
        if (!devPasswords && !applications)
          throw new ApiError(403, "local_login_disabled");
        const { username, email, password } = await readJson(request);
        limitLogin("alumni");
        const id =
          username === undefined
            ? await applications?.authenticate(email, password)
            : null;
        const account = id
          ? { id, role: "applicant" as const }
          : email === undefined &&
              username === "alumni" &&
              matchesPassword(password, devPasswords?.alumni)
            ? { id: "local:alumni", role: "alumni" as const }
            : null;
        if (!account) throw new ApiError(401, "invalid_credentials");
        const session = sessions.issue(account, cookie);
        response.setHeader("Set-Cookie", session.cookie);
        return send(200, { account: session.account });
      }
      if (method === "DELETE" && path === "/api/session") {
        await readJson(request);
        response.setHeader("Set-Cookie", sessions.clear(cookie));
        return send(200, { account: null });
      }
      if (applications && method === "POST" && path === "/api/applications")
        return send(201, await applications.register(await readJson(request)));
      if (
        applications &&
        method === "GET" &&
        path === "/api/applications/mine"
      ) {
        const account = sessions.read(cookie);
        if (!account) throw new ApiError(401, "authentication_required");
        if (account.role !== "applicant")
          throw new ApiError(404, "application_not_found");
        const profile = await applications.own(account.id);
        if (!profile) throw new ApiError(404, "application_not_found");
        return send(200, profile);
      }
      if (
        applications &&
        method === "GET" &&
        path === "/api/admin/applications"
      ) {
        await requireRole("admin");
        return send(200, await applications.list());
      }
      const approval = path?.match(
        /^\/api\/admin\/applications\/([a-f0-9-]{36})\/approve$/,
      );
      if (applications && method === "POST" && approval) {
        const reviewer = await requireRole("admin");
        const { verified } = await readJson(request);
        return send(
          200,
          await applications.approve(approval[1], reviewer.id, verified),
        );
      }
      if (news && method === "GET" && path === "/api/news")
        return send(200, await news.listPublic());
      const article = path?.match(/^\/api\/news\/([a-z0-9-]{1,80})$/);
      if (news && method === "GET" && article)
        return send(200, await news.readPublic(article[1]));
      if (news && path === "/api/admin/news") {
        await requireRole("admin");
        if (method === "GET") return send(200, await news.listAdmin());
        if (method === "POST")
          return send(201, await news.create(await readJson(request)));
      }
      const adminArticle = path?.match(
        /^\/api\/admin\/news\/([a-z0-9-]{1,80})(?:\/(publish|withdraw))?$/,
      );
      if (news && adminArticle) {
        await requireRole("admin");
        const [, slug, action] = adminArticle;
        if (method === "PATCH" && !action)
          return send(200, await news.update(slug, await readJson(request)));
        if (method === "POST" && action) {
          await readJson(request);
          return send(
            200,
            await (action === "publish"
              ? news.publish(slug)
              : news.withdraw(slug)),
          );
        }
      }
      if (method === "GET" && path === "/api/events") {
        const own =
          new URLSearchParams(request.url?.split("?")[1]).get("registered") ===
          "true";
        const account = own ? await requireRole("alumni") : undefined;
        return send(200, await events.list(false, account?.id));
      }
      const publicEvent = path?.match(
        /^\/api\/events\/([a-z0-9-]{1,80})(\/registrations)?$/,
      );
      if (publicEvent) {
        const [, slug, registration] = publicEvent;
        if (method === "GET" && !registration)
          return send(200, await events.get(slug));
        if (
          registration &&
          (method === "GET" || method === "POST" || method === "DELETE")
        ) {
          const account = await requireRole("alumni");
          if (method === "GET")
            return send(200, await events.ownRegistration(slug, account.id));
          const input = await readJson(request);
          if (method === "DELETE")
            return send(
              200,
              await events.cancel(slug, account.id, input.registrationId),
            );
          return send(
            201,
            await events.register(slug, account.id, input.guests),
          );
        }
      }
      if (path === "/api/admin/events") {
        await requireRole("admin");
        if (method === "GET") return send(200, await events.list(true));
        if (method === "POST")
          return send(201, await events.create(await readJson(request)));
      }
      const adminEvent = path?.match(
        /^\/api\/admin\/events\/([a-z0-9-]{1,80})(?:\/(publish|close-registration|registrations|registrations-export))?$/,
      );
      if (adminEvent) {
        await requireRole("admin");
        const [, slug, action] = adminEvent;
        if (method === "PATCH" && !action)
          return send(200, await events.update(slug, await readJson(request)));
        if (method === "GET" && action === "registrations")
          return send(200, await events.registrationReport(slug));
        if (method === "GET" && action === "registrations-export") {
          const data = eventWorkbook(await events.registrationReport(slug));
          response.writeHead(200, {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="registrations-${slug}.xlsx"`,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          });
          response.end(data);
          return;
        }
        if (method === "POST" && action === "publish") {
          await readJson(request);
          return send(200, await events.publish(slug));
        }
        if (method === "POST" && action === "close-registration") {
          await readJson(request);
          return send(200, await events.closeRegistration(slug));
        }
      }
      return send(404, { error: "not_found" });
    } catch (error) {
      if (error instanceof ApiError)
        return send(error.status, { error: error.message });
      log("error", "request_failed");
      return send(500, { error: "internal_error" });
    }
  });
}
