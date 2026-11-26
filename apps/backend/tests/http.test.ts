import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import type { applicationStore } from "../src/applications.ts";
import type { eventStore } from "../src/events.ts";
import type { homepageStore } from "../src/homepage.ts";
import { createHttpServer } from "../src/http.ts";

// Gửi yêu cầu đến các đường dẫn HTTP thật và giả lập trạng thái sẵn sàng của cơ sở dữ liệu.
test("serves health, degrades readiness and avoids leaking database details", async (t) => {
  let check = async () => true;
  const server = createHttpServer(
    { version: "0.1.0", commit: "local" },
    () => check(),
    () => {},
    {} as ReturnType<typeof eventStore>,
  );
  server.listen(0, "127.0.0.1");
  t.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${address.port}`;
  assert.equal((await fetch(`${url}/api/admin/events`)).status, 401);
  assert.equal(
    (await fetch(`${url}/api/session`, { method: "POST" })).status,
    403,
  );
  assert.deepEqual(await (await fetch(`${url}/health`)).json(), {
    status: "ok",
    version: "0.1.0",
    commit: "local",
  });
  assert.equal((await fetch(`${url}/ready`)).status, 200);
  check = async () => {
    throw new Error("private database details");
  };
  const unavailable = await fetch(`${url}/ready`);
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { status: "unavailable" });
  assert.equal((await fetch(`${url}/health`)).status, 200);
});

test("isolates staff and alumni sessions when both portals are open", async (t) => {
  const alumniId = "70e61fc5-a714-464e-acb9-44364012c615";
  const adminPassword = "staging-test-admin-password-only";
  const reviewerPassword = "staging-test-reviewer-password-only";
  const alumniPassword = "staging-test-alumni-password-only";
  const alumniEmail = "alumni@example.test";
  let listAccount: string | undefined;
  const imageReads: { slot: string; admin: boolean }[] = [];
  const applications = {
    async authenticate(email: unknown, password: unknown) {
      return email === alumniEmail && password === alumniPassword
        ? alumniId
        : null;
    },
    async own(id: string) {
      return id === alumniId ? { code: "VLU-001" } : null;
    },
  } as ReturnType<typeof applicationStore>;
  const server = createHttpServer(
    { version: "0.1.0", commit: "local" },
    async () => true,
    () => {},
    {
      async list(_admin: boolean, accountId?: string) {
        listAccount = accountId;
        return [];
      },
    } as unknown as ReturnType<typeof eventStore>,
    undefined,
    applications,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    () =>
      ({
        async image(slot: string, admin: boolean) {
          imageReads.push({ slot, admin });
          return { type: "image/png", bytes: Buffer.from("test illustration") };
        },
      }) as ReturnType<typeof homepageStore>,
    {
      staffPasswords: { admin: adminPassword, reviewer: reviewerPassword },
      secureCookies: true,
    },
  );
  server.listen(0, "127.0.0.1");
  t.after(() => server.close());
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  const alumniPath = "/api/session";
  const staffPath = "/api/admin/session";
  async function request(path: string, cookie = "", method = "GET", body = {}) {
    return fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
  }

  const admin = { username: "admin", password: adminPassword };
  const alumni = { email: alumniEmail, password: alumniPassword };
  assert.equal((await request(alumniPath, "", "POST", admin)).status, 401);
  assert.equal((await request(staffPath, "", "POST", alumni)).status, 401);

  const adminLogin = await request(staffPath, "", "POST", admin);
  assert.equal(adminLogin.status, 200);
  const staffHeader = adminLogin.headers.get("set-cookie") ?? "";
  assert.match(
    staffHeader,
    /^alumni_staff_session=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict; Secure;/,
  );
  const staffCookie = staffHeader.split(";")[0];
  const alumniLogin = await request(alumniPath, staffCookie, "POST", alumni);
  assert.equal(alumniLogin.status, 200);
  const alumniHeader = alumniLogin.headers.get("set-cookie") ?? "";
  assert.match(
    alumniHeader,
    /^alumni_session=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict; Secure;/,
  );
  const alumniCookie = alumniHeader.split(";")[0];
  const both = `${alumniCookie}; ${staffCookie}`;

  assert.equal(
    (await (await request(alumniPath, staffCookie)).json()).account,
    null,
  );
  assert.equal(
    (await (await request(staffPath, alumniCookie)).json()).account,
    null,
  );
  assert.equal(
    (await (await request(alumniPath, both)).json()).account.role,
    "alumni",
  );
  assert.equal(
    (await (await request(staffPath, both)).json()).account.role,
    "admin",
  );
  assert.equal((await request("/api/admin/events", alumniCookie)).status, 403);
  assert.equal((await request("/api/admin/events", both)).status, 200);
  // Ảnh công khai đọc bản công bố; ảnh nháp vẫn phải có phiên quản trị.
  assert.equal((await request("/api/homepage/images/career1")).status, 200);
  assert.deepEqual(imageReads.at(-1), { slot: "career1", admin: false });
  assert.equal(
    (await request("/api/admin/homepage/images/career1")).status,
    401,
  );
  assert.equal(
    (await request("/api/admin/homepage/images/career1", alumniCookie)).status,
    403,
  );
  assert.equal(
    (await request("/api/admin/homepage/images/career1", both)).status,
    200,
  );
  assert.deepEqual(imageReads.at(-1), { slot: "career1", admin: true });
  assert.equal((await request("/api/homepage/images/career5")).status, 404);
  // Danh sách cá nhân lấy chủ tài khoản từ phiên, bỏ qua ID giả do người dùng gửi.
  assert.equal((await request("/api/events?registered=true")).status, 401);
  assert.equal(
    (await request("/api/events?registered=true", staffCookie)).status,
    403,
  );
  assert.equal(
    (await request("/api/events?registered=true&accountId=someone-else", both))
      .status,
    200,
  );
  assert.equal(listAccount, alumniId);
  assert.equal((await request("/api/events")).status, 200);
  assert.equal(listAccount, undefined);
  assert.equal((await request("/api/applications/mine", both)).status, 200);

  const reviewerLogin = await request(staffPath, both, "POST", {
    username: "reviewer",
    password: reviewerPassword,
  });
  assert.equal(reviewerLogin.status, 200);
  const reviewerCookie = reviewerLogin.headers.get("set-cookie")?.split(";")[0];
  assert.equal(
    (await request("/api/admin/events", reviewerCookie)).status,
    403,
  );
  assert.equal(
    (await (await request(staffPath, staffCookie)).json()).account,
    null,
  );

  const alumniLogout = await request(
    alumniPath,
    `${alumniCookie}; ${reviewerCookie}`,
    "DELETE",
  );
  assert.match(
    alumniLogout.headers.get("set-cookie") ?? "",
    /^alumni_session=;/,
  );
  assert.equal(
    (await (await request(staffPath, reviewerCookie)).json()).account.role,
    "reviewer",
  );
  assert.equal(
    (await (await request(alumniPath, alumniCookie)).json()).account,
    null,
  );

  const repeatAlumniLogin = await request(
    alumniPath,
    reviewerCookie,
    "POST",
    alumni,
  );
  const newAlumniCookie = repeatAlumniLogin.headers
    .get("set-cookie")
    ?.split(";")[0];
  const staffLogout = await request(
    staffPath,
    `${newAlumniCookie}; ${reviewerCookie}`,
    "DELETE",
  );
  assert.match(
    staffLogout.headers.get("set-cookie") ?? "",
    /^alumni_staff_session=;/,
  );
  assert.equal(
    (await (await request(alumniPath, newAlumniCookie)).json()).account.role,
    "alumni",
  );
  assert.equal(
    (await (await request(staffPath, reviewerCookie)).json()).account,
    null,
  );
});
