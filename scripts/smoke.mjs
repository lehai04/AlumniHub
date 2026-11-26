import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = new URL(
  process.env.SMOKE_URL ??
    `http://127.0.0.1:${process.env.HTTP_PORT || "8080"}`,
);
assert.equal(base.protocol, "http:");
assert.ok(
  ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname),
  "Run smoke tests only on localhost",
);
assert.ok(
  process.env.LOCAL_ADMIN_PASSWORD && process.env.LOCAL_ALUMNI_PASSWORD,
  "Set the two local account passwords",
);
const fetchLocal = (path, init) =>
  fetch(new URL(path, base), { ...init, signal: AbortSignal.timeout(12000) });
const slug = `smoke-${randomUUID()}`;
const draft = {
  slug,
  title: `Smoke event ${slug}`,
  description: "Local integration test",
  location: "Van Lang",
  startsAt: "2030-04-01T10:00:00+07:00",
  capacity: 3,
};

function call(path, method = "GET", body, cookie) {
  return fetchLocal(`/api${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function expect(response, status) {
  const result = await response;
  assert.equal(
    result.status,
    status,
    `${result.url} returned ${result.status}`,
  );
  return result;
}
async function login(username, password) {
  const response = await expect(
    call(username === "alumni" ? "/session" : "/admin/session", "POST", {
      username,
      password,
    }),
    200,
  );
  const header = response.headers.get("set-cookie");
  assert.ok(header?.includes("HttpOnly"));
  return header.split(";")[0];
}

await expect(fetchLocal("/ready"), 200);
await expect(call("/admin/events"), 401);
await expect(call(`/events/${slug}/registrations`, "POST", { guests: 0 }), 401);
const admin = await login("admin", process.env.LOCAL_ADMIN_PASSWORD);
const alumni = await login("alumni", process.env.LOCAL_ALUMNI_PASSWORD);
const [staffEntry, alumniEntry] = await Promise.all([
  fetchLocal("/admin/login"),
  fetchLocal("/account"),
]);
assert.equal(staffEntry.status, 200);
assert.equal(alumniEntry.status, 200);
assert.match(await staffEntry.text(), /Đăng nhập quản trị/);
assert.match(await alumniEntry.text(), /<h1[^>]*>Đăng nhập<\/h1>/);
const bothPortals = `${admin}; ${alumni}`;
const readRole = async (path, cookie) =>
  (await (await expect(call(path, "GET", undefined, cookie), 200)).json())
    .account?.role;
assert.equal(await readRole("/admin/session", bothPortals), "admin");
assert.equal(await readRole("/session", bothPortals), "alumni");
assert.equal(await readRole("/admin/session", alumni), undefined);
assert.equal(await readRole("/session", admin), undefined);
if (process.env.SMOKE_HOMEPAGE === "1") {
  await expect(call("/admin/homepage"), 401);
  await expect(call("/admin/homepage", "PATCH", {}, alumni), 403);
  const homeDraft = await (
    await expect(call("/admin/homepage", "GET", undefined, admin), 200)
  ).json();
  const heading = `Trang chủ kiểm thử ${slug}`;
  let home = await (
    await expect(
      call(
        "/admin/homepage",
        "PATCH",
        {
          revision: homeDraft.revision,
          content: { ...homeDraft.content, heroTitle: heading },
        },
        admin,
      ),
      200,
    )
  ).json();
  assert.ok(
    !(await (await expect(fetchLocal("/"), 200)).text()).includes(heading),
  );
  const heroPath = "/api/homepage/images/hero";
  const oldImage = await fetchLocal(heroPath);
  const oldBytes = oldImage.ok
    ? Buffer.from(await oldImage.arrayBuffer())
    : null;
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+rX1sAAAAASUVORK5CYII=",
    "base64",
  );
  const upload = await expect(
    fetchLocal(`/api/admin/homepage/images/hero?revision=${home.revision}`, {
      method: "PUT",
      headers: { cookie: admin, "content-type": "image/png" },
      body: png,
    }),
    200,
  );
  home = await upload.json();
  const beforePublish = await fetchLocal(heroPath);
  if (oldBytes)
    assert.deepEqual(Buffer.from(await beforePublish.arrayBuffer()), oldBytes);
  else assert.equal(beforePublish.status, 404);
  await expect(
    call(
      "/admin/homepage/publish",
      "POST",
      { revision: homeDraft.revision },
      admin,
    ),
    409,
  );
  await expect(
    call("/admin/homepage/publish", "POST", { revision: home.revision }, admin),
    200,
  );
  const homeHtml = await (await expect(fetchLocal("/"), 200)).text();
  assert.ok(homeHtml.includes(heading) && homeHtml.includes(heroPath));
  const publishedImage = await expect(fetchLocal(heroPath), 200);
  assert.equal(publishedImage.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await publishedImage.arrayBuffer()), png);
  assert.match(
    await (
      await expect(fetchLocal("/admin", { headers: { cookie: admin } }), 200)
    ).text(),
    /Nội dung và ảnh trang chủ/,
  );
  console.log(
    "Local CMS homepage draft, artwork, publishing and access checks passed",
  );
}
if (process.env.LOCAL_REVIEWER_PASSWORD) {
  const reviewer = await login("reviewer", process.env.LOCAL_REVIEWER_PASSWORD);
  const service = {
    category: "library",
    title: `Smoke library ${slug}`,
    body: "Local integration test",
    startsAt: new Date(Date.now() - 60_000).toISOString(),
    endsAt: new Date(Date.now() + 3_600_000).toISOString(),
  };
  const publicPage = async () =>
    (await expect(fetchLocal("/services"), 200)).text();
  const adminPage = async (cookie) =>
    (
      await expect(fetchLocal("/admin/services", { headers: { cookie } }), 200)
    ).text();
  assert.match(await adminPage(admin), /Thêm bản nháp/);
  assert.doesNotMatch(await adminPage(reviewer), /Thêm bản nháp/);
  await expect(call("/admin/services"), 401);
  await expect(call("/admin/services", "POST", service, reviewer), 403);
  async function createEntry(data) {
    return (
      await expect(call("/admin/services", "POST", data, admin), 201)
    ).json();
  }
  async function transition(item, action, actor, status = 200) {
    const path = `/admin/services/${item.id}/${action}`;
    return (
      await expect(
        call(path, "POST", { revision: item.revision }, actor),
        status,
      )
    ).json();
  }
  let item = await createEntry(service);
  assert.ok(!(await publicPage()).includes(service.title));
  item = await transition(item, "submit", admin);
  await transition(item, "publish", admin, 403);
  assert.match(await adminPage(reviewer), /Duyệt và công bố/);
  assert.ok(!(await publicPage()).includes(service.title));
  const returned = await transition(item, "return", reviewer);
  item = await transition(returned, "submit", admin);
  await transition(returned, "publish", reviewer, 409);
  item = await transition(item, "publish", reviewer);
  assert.ok((await publicPage()).includes(service.title));
  await transition(item, "withdraw", reviewer);
  assert.ok(!(await publicPage()).includes(service.title));
  const expired = await createEntry({
    ...service,
    category: "benefits",
    title: `Smoke expired ${slug}`,
    startsAt: "2000-01-01T00:00:00Z",
    endsAt: "2000-01-02T00:00:00Z",
  });
  await transition(
    await transition(expired, "submit", admin),
    "publish",
    reviewer,
  );
  assert.ok(!(await publicPage()).includes(expired.title));
  console.log(
    "Local service content draft, review, publication, withdrawal and expiry passed",
  );
}
const recovery = {
  email: `${slug}-recovery@example.test`,
  password: "Old-test-password",
  fullName: "CSV thử khôi phục",
  identifierType: "mssv",
  identifier: randomUUID().replaceAll("-", "").slice(0, 16),
  faculty: "Công nghệ",
  phone: "0901234567",
};
await expect(call("/applications", "POST", recovery), 201);
const beforeReset = await expect(call("/session", "POST", recovery), 200);
const oldSession = beforeReset.headers.get("set-cookie").split(";")[0];
const email = recovery.email;
const resetRequest = (address) =>
  call("/password-reset/request", "POST", { email: address });
const genuine = await (await expect(resetRequest(email), 202)).json();
const unknown = await (
  await expect(resetRequest(`${slug}-unknown@example.test`), 202)
).json();
assert.deepEqual(genuine, unknown);
await expect(call("/local/mailbox", "POST", { email }, alumni), 403);
const lookupCode = async () =>
  (
    await (
      await expect(call("/local/mailbox", "POST", { email }, admin), 200)
    ).json()
  ).code;
const code = await lookupCode();
assert.match(code, /^\d{6}$/);
await expect(resetRequest(email), 202);
assert.equal(await lookupCode(), code);
const password = "New-test-password";
const complete = (value) =>
  call("/password-reset/complete", "POST", { email, code: value, password });
await expect(complete(code === "000000" ? "000001" : "000000"), 400);
const concurrent = await Promise.all([complete(code), complete(code)]);
assert.deepEqual(concurrent.map((item) => item.status).sort(), [200, 400]);
const sessionAfterReset = await (
  await expect(call("/session", "GET", undefined, oldSession), 200)
).json();
assert.equal(sessionAfterReset.account, null);
await expect(
  call("/session", "POST", { email, password: recovery.password }),
  401,
);
await expect(call("/session", "POST", { email, password }), 200);
assert.match(
  await (await expect(fetchLocal("/account/reset"), 200)).text(),
  /Quên mật khẩu/,
);
console.log(
  "Local email reset, single use, throttling and session revocation passed",
);
await expect(call("/admin/events", "POST", draft, alumni), 403);
await expect(
  call("/admin/events", "POST", { ...draft, guestLimit: 2 }, admin),
  201,
);
assert.match(
  await (
    await expect(
      fetchLocal("/admin/events", { headers: { cookie: admin } }),
      200,
    )
  ).text(),
  /Tạo bản nháp/,
);
await expect(call(`/events/${slug}`), 404);
await expect(
  call(`/events/${slug}/registrations`, "POST", { guests: 0 }, alumni),
  404,
);
const title = `${draft.title} updated`;
await expect(
  call(`/admin/events/${slug}`, "PATCH", { ...draft, title }, admin),
  200,
);
await expect(call(`/admin/events/${slug}/publish`, "POST", {}, admin), 200);
assert.match(
  await (await expect(fetchLocal("/events"), 200)).text(),
  new RegExp(title),
);
assert.match(
  await (
    await expect(
      fetchLocal(`/events/${slug}`, { headers: { cookie: alumni } }),
      200,
    )
  ).text(),
  /Số người đi cùng/,
);
await expect(
  call(`/events/${slug}/registrations`, "POST", { guests: 0 }, admin),
  403,
);
const registration = () =>
  call(`/events/${slug}/registrations`, "POST", { guests: 2 }, alumni);
const responses = await Promise.all([registration(), registration()]);
assert.deepEqual(responses.map(({ status }) => status).sort(), [201, 409]);
assert.deepEqual(await responses.find(({ status }) => status === 201).json(), {
  guests: 2,
  total: 3,
});
assert.deepEqual(await responses.find(({ status }) => status === 409).json(), {
  error: "already_registered",
});
await expect(
  call(`/admin/events/${slug}`, "PATCH", { ...draft, capacity: 2 }, admin),
  409,
);
const reportPath = `/admin/events/${slug}/registrations`;
await expect(call(reportPath), 401);
await expect(call(reportPath, "GET", undefined, alumni), 403);
await expect(
  call(`/admin/events/${slug}/close-registration`, "POST", {}, alumni),
  403,
);
const report = await (
  await expect(call(reportPath, "GET", undefined, admin), 200)
).json();
assert.equal(report.registration_count, 1);
assert.equal(report.expected_attendees, 3);
assert.equal(report.registrations[0].guests, 2);
assert.equal(report.registrations[0].total, 3);
assert.match(
  await (
    await expect(fetchLocal(reportPath, { headers: { cookie: admin } }), 200)
  ).text(),
  /người dự kiến tham dự/,
);
await expect(
  call(`/admin/events/${slug}/close-registration`, "POST", {}, admin),
  200,
);
const closed = await (await expect(registration(), 409)).json();
assert.equal(closed.error, "registration_closed");
const listed = await (await expect(call(`/events/${slug}`), 200)).json();
assert.ok(listed.registration_closed_at);
assert.equal(listed.registered_people, 3);
await expect(call("/session", "DELETE", {}, alumni), 200);
await expect(
  call(`/events/${slug}/registrations`, "POST", { guests: 0 }, alumni),
  401,
);
console.log(`Local event flow passed for ${slug}`);

const application = {
  fullName: "Alumni local smoke",
  email: `${slug}@example.test`,
  password: randomUUID(),
  identifierType: "cccd",
  identifier: String(
    BigInt(`0x${randomUUID().replaceAll("-", "").slice(0, 10)}`) %
      1000000000000n,
  ).padStart(12, "0"),
  faculty: "Khoa kiểm thử",
  phone: "0901234567",
};
const submissions = await Promise.all([
  call("/applications", "POST", application),
  call("/applications", "POST", application),
]);
assert.deepEqual(submissions.map(({ status }) => status).sort(), [201, 409]);
const loginResponse = await expect(
  call("/session", "POST", {
    email: application.email,
    password: application.password,
  }),
  200,
);
const applicant = loginResponse.headers.get("set-cookie").split(";")[0];
const pending = await (
  await expect(call("/applications/mine", "GET", undefined, applicant), 200)
).json();
assert.equal(pending.code, null);
assert.equal(pending.identifier, undefined);
await expect(
  call(`/events/${slug}/registrations`, "POST", { guests: 0 }, applicant),
  403,
);
await expect(call("/admin/applications", "GET", undefined, applicant), 403);
const review = await (
  await expect(call("/admin/applications", "GET", undefined, admin), 200)
).json();
const record = review.applications.find(
  ({ email }) => email === application.email,
);
assert.equal(record.identifier, application.identifier);
assert.equal(record.password_hash, undefined);
const approvalPath = `/admin/applications/${record.id}/approve`;
await expect(call(approvalPath, "POST", { verified: true }, applicant), 403);
await expect(call(approvalPath, "POST", { verified: false }, admin), 400);
const approvals = await Promise.all(
  Array.from({ length: 2 }, async () =>
    (
      await expect(call(approvalPath, "POST", { verified: true }, admin), 200)
    ).json(),
  ),
);
assert.deepEqual(approvals[0], approvals[1]);
const issued = approvals[0];
const dateParts = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})
  .format(new Date(issued.issued_at))
  .replaceAll("/", "");
assert.match(issued.code, new RegExp(`^ALN ${dateParts} [0-9]{6}$`));
const owned = await (
  await expect(call("/applications/mine", "GET", undefined, applicant), 200)
).json();
assert.equal(owned.code, issued.code);
assert.equal(
  (await (await call("/session", "GET", undefined, applicant)).json()).account
    .role,
  "alumni",
);
assert.match(
  await (
    await expect(
      fetchLocal("/account", { headers: { cookie: applicant } }),
      200,
    )
  ).text(),
  /Thẻ Thành viên/,
);
console.log(
  "Local account registration, CCCD review and idempotent card issuance passed",
);

const newsPath = `/news/${slug}`;
const adminNewsPath = `/admin/news/${slug}`;
const article = {
  slug,
  title: `Tin kiểm thử ${slug}`,
  summary: "Tóm tắt kiểm thử local",
  body: "Nội dung nháp",
  cover: "community",
};
await expect(call("/admin/news"), 401);
await expect(call("/admin/news", "POST", article, applicant), 403);
await expect(call("/admin/news", "POST", article, admin), 201);
await expect(call(newsPath), 404);
await expect(fetchLocal(newsPath), 404);
assert.ok(
  !(await (await call("/news")).json()).some((item) => item.slug === slug),
);
await expect(
  call(
    adminNewsPath,
    "PATCH",
    { ...article, body: "<em>Nội dung đã sửa</em>" },
    admin,
  ),
  200,
);
await expect(call(`${adminNewsPath}/publish`, "POST", {}, applicant), 403);
await expect(call(`${adminNewsPath}/publish`, "POST", {}, admin), 200);
assert.match(
  await (await expect(fetchLocal("/news"), 200)).text(),
  new RegExp(slug),
);
for (const cookie of [undefined, applicant]) {
  const page = await expect(
    fetchLocal(newsPath, cookie ? { headers: { cookie } } : undefined),
    200,
  );
  assert.match(await page.text(), /&lt;em&gt;Nội dung đã sửa&lt;\/em&gt;/);
}
await expect(call(`${adminNewsPath}/withdraw`, "POST", {}, applicant), 403);
await expect(call(`${adminNewsPath}/withdraw`, "POST", {}, admin), 200);
await expect(call(newsPath), 404);
await expect(fetchLocal(newsPath), 404);
const publicNews = await (await expect(call("/news"), 200)).json();
assert.ok(!publicNews.some((item) => item.slug === slug));
const adminNews = await (
  await expect(call("/admin/news", "GET", undefined, admin), 200)
).json();
assert.ok(adminNews.find((item) => item.slug === slug)?.withdrawn_at);
assert.match(
  await (
    await expect(fetchLocal("/admin/news", { headers: { cookie: admin } }), 200)
  ).text(),
  /Đã gỡ/,
);
await expect(call(`${adminNewsPath}/publish`, "POST", {}, admin), 200);
await expect(call(newsPath), 200);
console.log(
  "Local news draft, edit, publication, withdrawal and republication passed",
);

async function addCareerAccount(label) {
  const email = `${slug}-${label}@example.test`;
  const password = randomUUID();
  const inserted = {
    ...application,
    email,
    password,
    fullName: label,
    identifierType: "mssv",
    identifier: randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
  };
  await expect(call("/applications", "POST", inserted), 201);
  const login = await expect(
    call("/session", "POST", { email, password }),
    200,
  );
  const cookie = login.headers.get("set-cookie").split(";")[0];
  await expect(call("/career/own-jobs", "POST", {}, cookie), 403);
  const result = await (
    await call("/session", "GET", undefined, cookie)
  ).json();
  await expect(
    call(
      `/admin/applications/${result.account.id}/approve`,
      "POST",
      { verified: true },
      admin,
    ),
    200,
  );
  return cookie;
}

const recruiter = await addCareerAccount("recruiter");
const outsider = await addCareerAccount("outsider");
const jobInput = {
  title: `Kỹ sư ${slug}`,
  company: "Doanh nghiệp mẫu",
  location: "TP.HCM",
  mode: "hybrid",
  description: "Mô tả tuyển dụng local",
};
await expect(call("/career/jobs"), 401);
const job = await (
  await expect(call("/career/own-jobs", "POST", jobInput, recruiter), 201)
).json();
const jobPath = `/career/jobs/${job.id}`;
const manage = `/career/own-jobs/${job.id}`;
await expect(call(jobPath, "GET", undefined, applicant), 404);
await expect(call(`${manage}/publish`, "POST", {}, outsider), 404);
await expect(call(`${manage}/publish`, "POST", {}, recruiter), 200);
assert.ok(
  (
    await (
      await expect(
        call(
          `/career/jobs?q=${slug}&mode=hybrid&location=TP.HCM`,
          "GET",
          undefined,
          applicant,
        ),
        200,
      )
    ).json()
  ).some((row) => row.id === job.id),
);
assert.deepEqual(
  await (
    await expect(
      call(`/career/jobs?q=${slug}&mode=remote`, "GET", undefined, applicant),
      200,
    )
  ).json(),
  [],
);
const profile = {
  fullName: "Ứng viên Career",
  email: "private@example.test",
  phone: "0901234567",
  specialty: "Kỹ thuật",
  birthDate: "2000-12-31",
  intro: "Giới thiệu rút gọn",
  looking: true,
};
assert.equal(
  (
    await (
      await expect(call("/career/profile", "GET", undefined, applicant), 200)
    ).json()
  ).looking,
  false,
);
await expect(call("/career/profile", "PATCH", profile, applicant), 200);
// Các mục mới được lưu riêng và vẫn còn khi biểu mẫu cũ chưa gửi những trường này.
const extraProfile = {
  education: "Đại học Văn Lang",
  skills: "TypeScript, SQL",
  projects: "Dự án nội bộ",
  activities: "Hoạt động Alumni",
  jobTitle: "Kỹ sư",
  location: "TP.HCM",
  linkedin: "https://www.linkedin.com/in/example",
};
await expect(
  call("/career/profile", "PATCH", { ...profile, ...extraProfile }, applicant),
  200,
);
await expect(call("/career/profile", "PATCH", profile, applicant), 200);
const restoredProfile = await (
  await expect(call("/career/profile", "GET", undefined, applicant), 200)
).json();
for (const [key, value] of Object.entries(extraProfile))
  assert.equal(restoredProfile.profile[key], value);
await expect(
  call(
    "/career/profile",
    "PATCH",
    { ...profile, linkedin: "javascript:alert(1)" },
    applicant,
  ),
  400,
);
await expect(
  call(
    "/career/profile",
    "PATCH",
    { ...profile, avatar: "data:image/svg+xml;base64,PHN2Zz4=" },
    applicant,
  ),
  400,
);
const candidates = async (cookie) =>
  await (
    await expect(call("/career/candidates", "GET", undefined, cookie), 200)
  ).json();
assert.deepEqual(await candidates(outsider), []);
const candidate = (await candidates(recruiter)).find(
  ({ profile }) => profile.fullName === "Ứng viên Career",
);
assert.equal(candidate.profile.specialty, "Kỹ thuật");
const candidateDetail = `/career/candidates/${candidate.id}`;
await expect(call(candidateDetail, "GET", undefined, recruiter), 200);
await expect(call(candidateDetail, "GET", undefined, outsider), 404);
assert.match(
  await (
    await expect(
      fetchLocal(candidateDetail, { headers: { cookie: recruiter } }),
      200,
    )
  ).text(),
  /Ứng viên Career/,
);
assert.ok(
  !(
    "email" in candidate.profile ||
    "phone" in candidate.profile ||
    "birthDate" in candidate.profile ||
    "cv" in candidate.profile
  ),
);
await expect(
  call("/career/profile", "PATCH", { ...profile, looking: false }, applicant),
  200,
);
assert.ok(!(await candidates(recruiter)).some(({ id }) => id === candidate.id));
await expect(call(candidateDetail, "GET", undefined, recruiter), 404);
await expect(
  fetchLocal(candidateDetail, { headers: { cookie: recruiter } }),
  404,
);
assert.match(
  await (
    await expect(
      fetchLocal("/career?tab=profile", { headers: { cookie: applicant } }),
      200,
    )
  ).text(),
  /Hồ sơ nghề nghiệp/,
);
assert.match(
  await (
    await expect(
      fetchLocal(`/career/jobs/${job.id}`, { headers: { cookie: applicant } }),
      200,
    )
  ).text(),
  /Tải CV lên/,
);

const original = Buffer.from("%PDF-1.7\nOriginal smoke\n%%EOF\n");
const revised = Buffer.from("%PDF-1.7\nRevised smoke\n%%EOF\n");
const upload = (path, cookie, pdf, method = "POST") =>
  fetchLocal(`/api${path}`, {
    method,
    body: pdf,
    headers: {
      cookie,
      "content-type": "application/pdf",
      "x-cv-name": "CV%20Alumni",
    },
  });
await expect(upload("/career/cvs", applicant, Buffer.from("not PDF")), 415);
await expect(upload("/career/cvs", applicant, Buffer.alloc(5242881)), 413);
const cv = await (
  await expect(upload("/career/cvs", applicant, original), 201)
).json();
await expect(call(`/career/cvs/${cv.id}`, "GET", undefined, recruiter), 404);
await expect(call(`${jobPath}/apply`, "POST", { cvId: cv.id }, outsider), 404);
const applied = await (
  await expect(
    call(`${jobPath}/apply`, "POST", { cvId: cv.id }, applicant),
    201,
  )
).json();
await expect(call(`${jobPath}/apply`, "POST", { cvId: cv.id }, applicant), 409);
await expect(upload(`/career/cvs/${cv.id}`, applicant, revised, "PUT"), 200);
await expect(call(`/career/cvs/${cv.id}`, "DELETE", {}, applicant), 200);
const submittedCv = `/career/applications/${applied.id}/cv`;
await expect(call(submittedCv, "GET", undefined, outsider), 404);
for (const cookie of [recruiter, applicant]) {
  const download = await expect(
    call(submittedCv, "GET", undefined, cookie),
    200,
  );
  assert.match(download.headers.get("content-disposition"), /^attachment/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), original);
}
await expect(call(`${manage}/applications`, "GET", undefined, outsider), 404);
const submissionsForJob = await (
  await expect(call(`${manage}/applications`, "GET", undefined, recruiter), 200)
).json();
assert.equal(submissionsForJob.applications[0].id, applied.id);
assert.ok(
  (
    await (
      await expect(
        call("/career/applications", "GET", undefined, applicant),
        200,
      )
    ).json()
  ).some((row) => row.id === applied.id),
);
assert.deepEqual(
  await (
    await expect(call("/career/applications", "GET", undefined, outsider), 200)
  ).json(),
  [],
);
const uploads = await Promise.all(
  Array.from({ length: 6 }, () => upload("/career/cvs", applicant, original)),
);
assert.deepEqual(
  uploads.map(({ status }) => status).sort(),
  [201, 201, 201, 201, 201, 409],
);
await expect(call(`${manage}/close`, "POST", {}, outsider), 404);
await expect(call(`${manage}/close`, "POST", {}, recruiter), 200);
await expect(call(`${jobPath}/apply`, "POST", { cvId: cv.id }, outsider), 409);
console.log(
  "Local Career Hub profile, posting permissions, private CVs, snapshots and history passed",
);

const rolesPath = "/community/roles";
const adminCommunity = "/admin/community";
const qualified = {
  reason: "Minh chứng giả lập",
  evidence: "https://example.test/evidence",
};
const rolesOfApplicant = async () =>
  (
    await (
      await expect(call("/applications/mine", "GET", undefined, applicant), 200)
    ).json()
  ).roles;
await expect(
  call(rolesPath, "POST", { ...qualified, role: "engagement" }),
  401,
);
await expect(
  call(
    rolesPath,
    "POST",
    { ...qualified, role: "engagement", evidence: "javascript:void(0)" },
    applicant,
  ),
  400,
);
const engagement = await (
  await expect(
    call(rolesPath, "POST", { ...qualified, role: "engagement" }, applicant),
    201,
  )
).json();
await expect(
  call(rolesPath, "POST", { ...qualified, role: "engagement" }, applicant),
  409,
);
await expect(
  call(
    rolesPath,
    "POST",
    { ...qualified, role: "ambassador", targetCode: issued.code },
    applicant,
  ),
  400,
);
const nomination = await (
  await expect(
    call(
      rolesPath,
      "POST",
      { ...qualified, role: "ambassador", targetCode: issued.code },
      recruiter,
    ),
    201,
  )
).json();
await expect(
  call(
    `${adminCommunity}/roles/${engagement.id}`,
    "PATCH",
    { action: "approve" },
    applicant,
  ),
  403,
);
assert.deepEqual(await rolesOfApplicant(), []);
const reviewRole = (entry, action) =>
  call(
    `${adminCommunity}/roles/${entry.id}`,
    "PATCH",
    { action, note: "Kiểm thử quyết định thủ công" },
    admin,
  );
await expect(reviewRole(engagement, "approve"), 200);
await expect(reviewRole(nomination, "approve"), 200);
assert.deepEqual(await rolesOfApplicant(), ["ambassador", "engagement"]);
const upgradedPage = await expect(
  fetchLocal("/account", { headers: { cookie: applicant } }),
  200,
);
assert.match(await upgradedPage.text(), /Thẻ Đại sứ/);
const ownRequests = await (
  await expect(call(rolesPath, "GET", undefined, applicant), 200)
).json();
assert.ok(
  ownRequests.some(
    (item) => item.id === engagement.id && item.status === "approved",
  ),
);
assert.ok(!ownRequests.some((item) => item.id === nomination.id));
await expect(reviewRole(nomination, "end"), 200);
assert.deepEqual(await rolesOfApplicant(), ["engagement"]);
const downgraded = await (
  await expect(call("/applications/mine", "GET", undefined, applicant), 200)
).json();
assert.equal(downgraded.code, issued.code);
const denied = await (
  await expect(
    call(rolesPath, "POST", { ...qualified, role: "engagement" }, outsider),
    201,
  )
).json();
await expect(reviewRole(denied, "reject"), 200);
const endedRoles = await (
  await expect(call(`${adminCommunity}/roles`, "GET", undefined, admin), 200)
).json();
assert.ok(endedRoles.find((item) => item.id === nomination.id)?.ended_at);
assert.equal(
  endedRoles.find((item) => item.id === denied.id)?.status,
  "rejected",
);

const submittedPost = await (
  await expect(
    call(
      "/community/posts",
      "POST",
      { topic: "career", body: "Bài cộng đồng kiểm thử" },
      applicant,
    ),
    201,
  )
).json();
const boardContains = async () =>
  (
    await (
      await expect(call("/community/board", "GET", undefined, recruiter), 200)
    ).json()
  ).some((item) => item.id === submittedPost.id);
assert.equal(await boardContains(), false);
await expect(call("/community/board"), 401);
const moderate = (action) =>
  call(
    `${adminCommunity}/posts/${submittedPost.id}`,
    "PATCH",
    { action },
    admin,
  );
await expect(moderate("show"), 200);
assert.equal(await boardContains(), true);
await expect(moderate("hide"), 200);
assert.equal(await boardContains(), false);
await expect(moderate("show"), 200);
assert.equal(await boardContains(), true);
assert.match(
  await (
    await expect(
      fetchLocal("/community?topic=career", { headers: { cookie: recruiter } }),
      200,
    )
  ).text(),
  /Bài cộng đồng kiểm thử/,
);

const proposal = await (
  await expect(
    call(
      "/community/collaborations",
      "POST",
      {
        need: "Đề xuất kiến tập",
        email: "liaison@example.test",
        unit: "Khoa A",
      },
      applicant,
    ),
    201,
  )
).json();
assert.equal(proposal.status, "pending");
const proposalPath = `${adminCommunity}/collaborations/${proposal.id}`;
await expect(
  call(proposalPath, "PATCH", { action: "forward", unit: "Khoa B" }, outsider),
  403,
);
assert.ok(
  !(
    await (
      await expect(
        call("/community/collaborations", "GET", undefined, outsider),
        200,
      )
    ).json()
  ).some((item) => item.id === proposal.id),
);
await expect(call(proposalPath, "PATCH", { action: "close" }, admin), 409);
await expect(
  call(proposalPath, "PATCH", { action: "forward", unit: "Khoa B" }, admin),
  200,
);
await expect(
  call(
    proposalPath,
    "PATCH",
    { action: "close", note: "Đã ghi nhận kết quả" },
    admin,
  ),
  200,
);
const ownProposal = (
  await (
    await expect(
      call("/community/collaborations", "GET", undefined, applicant),
      200,
    )
  ).json()
).find((item) => item.id === proposal.id);
assert.equal(ownProposal.status, "closed");
assert.equal(ownProposal.assigned_unit, "Khoa B");
assert.match(
  await (
    await expect(
      fetchLocal("/admin/community?tab=collaborations", {
        headers: { cookie: admin },
      }),
      200,
    )
  ).text(),
  /Đơn vị tiếp nhận/,
);
console.log(
  "Local community roles, moderation and private collaboration workflow passed",
);

const landing = await (await expect(fetchLocal("/"), 200)).text();
const vhubLink = landing.match(
  /<a[^>]+href="https:\/\/vhub\.vlu\.edu\.vn\/"[^>]*>/,
);
assert.match(vhubLink?.[0] ?? "", /target="_blank"/);
assert.ok(landing.includes('href="/services#benefits"'));
assert.match(
  await (await expect(fetchLocal("/alumni-card"), 200)).text(),
  /Giới thiệu thẻ Alumni/,
);
const memberHub = await (
  await expect(fetchLocal("/account", { headers: { cookie: applicant } }), 200)
).text();
assert.match(memberHub, /Hồ sơ nghề nghiệp/);
assert.match(memberHub, /Lịch sử ứng tuyển/);

const auditAccount = {
  ...application,
  fullName: "CSV kiểm thử nghiệm thu",
  email: `${slug}-audit@example.test`,
  identifierType: "mssv",
  identifier: randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
};
await expect(
  call("/applications", "POST", { ...auditAccount, phone: "090+123456" }),
  400,
);
await expect(call("/applications", "POST", auditAccount), 201);
await expect(
  call("/session", "POST", {
    email: auditAccount.email,
    password: "Sai mat khau",
  }),
  401,
);
const auditLogin = await expect(
  call("/session", "POST", {
    email: auditAccount.email,
    password: auditAccount.password,
  }),
  200,
);
const auditPending = auditLogin.headers.get("set-cookie").split(";")[0];
const openSlug = `${slug}-audit-open`;
await expect(
  call(
    "/admin/events",
    "POST",
    { ...draft, slug: openSlug, capacity: 1 },
    admin,
  ),
  201,
);
await expect(call(`/admin/events/${openSlug}/publish`, "POST", {}, admin), 200);
assert.match(
  await (await expect(fetchLocal(`/events/${openSlug}`), 200)).text(),
  /Đăng nhập để đăng ký/,
);
assert.match(
  await (
    await expect(
      fetchLocal(`/events/${openSlug}`, { headers: { cookie: auditPending } }),
      200,
    )
  ).text(),
  /Hồ sơ đang chờ duyệt/,
);
await expect(
  call(
    `/events/${openSlug}/registrations`,
    "POST",
    { guests: 0 },
    auditPending,
  ),
  403,
);
await expect(fetchLocal(newsPath, { headers: { cookie: auditPending } }), 200);
await expect(
  call(`/applications/${record.id}`, "GET", undefined, auditPending),
  404,
);
await expect(
  call(`/events/${openSlug}/registrations`, "POST", { guests: 0 }, applicant),
  201,
);
const full = await (
  await expect(
    call(`/events/${openSlug}/registrations`, "POST", { guests: 0 }, recruiter),
    409,
  )
).json();
assert.equal(full.error, "event_full");
const actualReport = await (
  await expect(
    call(`/admin/events/${openSlug}/registrations`, "GET", undefined, admin),
    200,
  )
).json();
assert.equal(actualReport.registration_count, 1);
assert.equal(actualReport.registrations[0].full_name, application.fullName);
assert.equal(actualReport.registrations[0].email, application.email);
assert.equal(actualReport.registrations[0].alumni_code, issued.code);
const exportPath = `/admin/events/${openSlug}/registrations-export`;
await expect(call(exportPath), 401);
await expect(call(exportPath, "GET", undefined, applicant), 403);
const workbookResponse = await expect(
  call(exportPath, "GET", undefined, admin),
  200,
);
assert.match(
  workbookResponse.headers.get("content-type") ?? "",
  /spreadsheetml.sheet/,
);
assert.equal(
  workbookResponse.headers.get("content-disposition"),
  `attachment; filename="registrations-${openSlug}.xlsx"`,
);
assert.equal(
  Buffer.from(await workbookResponse.arrayBuffer())
    .subarray(0, 4)
    .toString("hex"),
  "504b0304",
);
assert.match(
  await (
    await expect(
      fetchLocal(`/admin/events/${openSlug}/registrations`, {
        headers: { cookie: admin },
      }),
      200,
    )
  ).text(),
  /Xuất Excel/,
);

const nearSlug = `${slug}-audit-near`;
await expect(
  call(
    "/admin/events",
    "POST",
    {
      ...draft,
      slug: nearSlug,
      startsAt: new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(),
    },
    admin,
  ),
  201,
);
await expect(call(`/admin/events/${nearSlug}/publish`, "POST", {}, admin), 200);
const tooLate = await (
  await expect(
    call(`/events/${nearSlug}/registrations`, "POST", { guests: 0 }, applicant),
    409,
  )
).json();
assert.equal(tooLate.error, "registration_deadline_passed");

const cancellationSlug = `${slug}-cancel`;
const cancellationDraft = { ...draft, slug: cancellationSlug };
const cancellationPath = `/events/${cancellationSlug}/registrations`;
const editCancellationEvent = (updates) =>
  call(
    `/admin/events/${cancellationSlug}`,
    "PATCH",
    { ...cancellationDraft, ...updates },
    admin,
  );
const submitCancellationEvent = (guests) =>
  call(cancellationPath, "POST", { guests }, applicant);
const readOwnRegistration = async (cookie = applicant) =>
  (await expect(call(cancellationPath, "GET", undefined, cookie), 200)).json();
const cancelRegistration = (entry, cookie = applicant) =>
  call(
    cancellationPath,
    "DELETE",
    { registrationId: entry.registration_id },
    cookie,
  );
const readEvent = async () =>
  (await expect(call(`/events/${cancellationSlug}`), 200)).json();
const created = await (
  await expect(call("/admin/events", "POST", cancellationDraft, admin), 201)
).json();
assert.equal(created.guest_limit, 0);
await expect(
  call(`/admin/events/${cancellationSlug}/publish`, "POST", {}, admin),
  200,
);
await expect(submitCancellationEvent(1), 400);
await expect(editCancellationEvent({ guestLimit: 3 }), 400);
await expect(editCancellationEvent({ guestLimit: 2 }), 200);
await expect(submitCancellationEvent(2), 201);
const { registration: firstBooking, selfOnly: firstSelfOnly } =
  await readOwnRegistration();
assert.equal(firstSelfOnly, false);
assert.equal(firstBooking.guests, 2);
assert.deepEqual(await readOwnRegistration(recruiter), {
  registration: null,
  selfOnly: false,
});
await expect(cancelRegistration(firstBooking, recruiter), 404);
await expect(cancelRegistration(firstBooking, ""), 401);
assert.equal((await readEvent()).registered_people, 3);
const detailsForRegistrant = async () =>
  (
    await expect(
      fetchLocal(`/events/${cancellationSlug}`, {
        headers: { cookie: applicant },
      }),
      200,
    )
  ).text();
assert.match(await detailsForRegistrant(), /Hủy đăng ký/);
await expect(cancelRegistration(firstBooking), 200);
assert.equal((await readEvent()).registered_people, 0);
assert.deepEqual(await readOwnRegistration(), {
  registration: null,
  selfOnly: true,
});
const afterCancellation = await detailsForRegistrant();
assert.match(afterCancellation, /chỉ có thể đăng ký lại cho bản thân/);
assert.ok(!afterCancellation.includes('name="guests"'));
assert.equal(
  (await (await expect(submitCancellationEvent(1), 400)).json()).error,
  "reregistration_self_only",
);
await expect(call(cancellationPath, "POST", { guests: 1 }, recruiter), 201);
const seatHolder = await login("alumni", process.env.LOCAL_ALUMNI_PASSWORD);
await expect(call(cancellationPath, "POST", { guests: 0 }, seatHolder), 201);
const { registration: lastSeat } = await readOwnRegistration(seatHolder);
assert.equal(
  (await (await expect(submitCancellationEvent(0), 409)).json()).error,
  "event_full",
);
await expect(cancelRegistration(lastSeat, seatHolder), 200);
await expect(submitCancellationEvent(0), 201);
const { registration: secondBooking } = await readOwnRegistration();
assert.equal(secondBooking.guests, 0);
assert.notEqual(secondBooking.registration_id, firstBooking.registration_id);
await expect(cancelRegistration(firstBooking), 404);
assert.equal((await readEvent()).registered_people, 3);
await expect(
  editCancellationEvent({
    guestLimit: 2,
    startsAt: new Date(Date.now() + 23 * 3_600_000).toISOString(),
  }),
  200,
);
const insideCancellationCutoff = await readEvent();
assert.equal(insideCancellationCutoff.cancellation_deadline_passed, true);
assert.equal(insideCancellationCutoff.registration_deadline_passed, false);
assert.equal(
  (await (await expect(cancelRegistration(secondBooking), 409)).json()).error,
  "cancellation_deadline_passed",
);
assert.match(await detailsForRegistrant(), /Đã hết hạn hủy/);
assert.equal((await readEvent()).registered_people, 3);
console.log(
  "Local per-event guest limit, cancellation, available seats and re-registration passed",
);
assert.match(
  await (await expect(fetchLocal(`/events/${nearSlug}`), 200)).text(),
  /Đã hết hạn đăng ký/,
);

const cvInventory = await (
  await expect(call("/career/cvs", "GET", undefined, applicant), 200)
).json();
assert.ok(cvInventory.length >= 2);
await expect(
  call(
    `/career/cvs/${cvInventory[0].id}`,
    "PATCH",
    { name: "Đổi tên CV kiểm thử" },
    applicant,
  ),
  200,
);
await expect(
  call(`/career/cvs/${cvInventory[1].id}`, "GET", undefined, applicant),
  200,
);
console.log(
  "Ver01 acceptance regressions passed for access, navigation, event deadline, identity report and CV rename",
);

if (process.env.SMOKE_HOMEPAGE === "1") {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+rX1sAAAAASUVORK5CYII=",
    "base64",
  );
  const cmsViewer = await login("alumni", process.env.LOCAL_ALUMNI_PASSWORD);
  for (const page of [
    "news",
    "events",
    "services",
    "career",
    "community",
    "alumni-card",
  ]) {
    const endpoint = `/admin/pages/${page}`;
    const publicImage = `/api/pages/${page}/image`;
    const pageTitle = `CMS ${page} ${slug}`;
    const linkUrl = `/alumni-card?ref=${page}-${slug}`;
    const content = {
      title: pageTitle,
      description: `Mô tả ${pageTitle}`,
      imageAlt: "Ảnh thử nghiệm",
      linkLabel: "Xem thông tin",
      linkUrl,
    };
    await expect(call(endpoint), 401);
    const state = await (
      await expect(call(endpoint, "GET", undefined, admin), 200)
    ).json();
    await expect(
      call(endpoint, "PATCH", { revision: state.revision, content }, cmsViewer),
      403,
    );
    for (const invalid of ["javascript:invalid", "//example.test/path"])
      await expect(
        call(
          endpoint,
          "PATCH",
          {
            revision: state.revision,
            content: { ...content, linkUrl: invalid },
          },
          admin,
        ),
        400,
      );
    let pageDraft = await (
      await expect(
        call(endpoint, "PATCH", { revision: state.revision, content }, admin),
        200,
      )
    ).json();
    const oldPublicImage = await fetchLocal(publicImage);
    const previousImage = oldPublicImage.ok
      ? Buffer.from(await oldPublicImage.arrayBuffer())
      : null;
    const uploadImage = await expect(
      fetchLocal(`/api${endpoint}/image?revision=${pageDraft.revision}`, {
        method: "PUT",
        headers: { cookie: admin, "content-type": "image/png" },
        body: png,
      }),
      200,
    );
    pageDraft = await uploadImage.json();
    const stillPublic = await fetchLocal(publicImage);
    if (previousImage)
      assert.deepEqual(
        Buffer.from(await stillPublic.arrayBuffer()),
        previousImage,
      );
    else assert.equal(stillPublic.status, 404);
    const before = await (await expect(fetchLocal(`/${page}`), 200)).text();
    assert.ok(!before.includes(pageTitle) && !before.includes(linkUrl));
    if (page !== "news") assert.ok(!before.includes(`CMS news ${slug}`));
    await expect(
      call(`${endpoint}/publish`, "POST", { revision: state.revision }, admin),
      409,
    );
    await expect(
      call(
        `${endpoint}/publish`,
        "POST",
        { revision: pageDraft.revision },
        cmsViewer,
      ),
      403,
    );
    pageDraft = await (
      await expect(
        call(
          `${endpoint}/publish`,
          "POST",
          { revision: pageDraft.revision },
          admin,
        ),
        200,
      )
    ).json();
    const rendered = await (await expect(fetchLocal(`/${page}`), 200)).text();
    assert.ok(
      rendered.includes(pageTitle) &&
        rendered.includes(content.description) &&
        rendered.includes(`href="${linkUrl}"`) &&
        rendered.includes(publicImage),
    );
    const image = await expect(fetchLocal(publicImage), 200);
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
    if (page === "news") {
      pageDraft = await (
        await expect(
          call(
            `${endpoint}/image?revision=${pageDraft.revision}`,
            "DELETE",
            undefined,
            admin,
          ),
          200,
        )
      ).json();
      await expect(fetchLocal(publicImage), 200);
      await expect(
        call(
          `${endpoint}/publish`,
          "POST",
          { revision: pageDraft.revision },
          admin,
        ),
        200,
      );
      await expect(fetchLocal(publicImage), 404);
      assert.match(
        await (
          await expect(
            fetchLocal(`/admin/pages/${page}`, { headers: { cookie: admin } }),
            200,
          )
        ).text(),
        /Lưu bản nháp/,
      );
    }
  }
  console.log(
    "Local CMS draft, link validation, images and publishing passed on six public pages",
  );
  for (const kind of ["news", "events"]) {
    const itemSlug = `${slug}-cms-${kind}`;
    const itemPath = `/${kind}/${itemSlug}`;
    const endpoint = `/admin/${kind}-content/${itemSlug}`;
    const imagePath = `/api/${kind}-content/${itemSlug}/image`;
    const previousBody = `Nội dung gốc ${itemSlug}`;
    const initial =
      kind === "news"
        ? { slug: itemSlug, title: "Tin nháp", body: previousBody }
        : {
            ...draft,
            slug: itemSlug,
            title: "Sự kiện nháp",
            description: previousBody,
          };
    await expect(call(`/admin/${kind}`, "POST", initial, admin), 201);
    await expect(call(`/${kind}-content/${itemSlug}`), 404);
    await expect(fetchLocal(itemPath), 404);
    await expect(call(endpoint, "GET", undefined, cmsViewer), 403);
    await expect(
      call(
        `/admin/${kind}-content/${itemSlug}-missing`,
        "GET",
        undefined,
        admin,
      ),
      404,
    );
    const state = await (
      await expect(call(endpoint, "GET", undefined, admin), 200)
    ).json();
    assert.equal(state.content.body, previousBody);
    const editor = await expect(
      fetchLocal(`/admin/items/${kind}/${itemSlug}`, {
        headers: { cookie: admin },
      }),
      200,
    );
    assert.match(await editor.text(), /Lưu bản nháp/);
    const content = {
      title: `Tiêu đề đã công bố ${itemSlug}`,
      body: `Nội dung đã công bố ${itemSlug}`,
      imageAlt: "Ảnh CMS",
      linkLabel: "Thông tin thêm",
      linkUrl: "https://example.test/info",
      ...(kind === "news" ? { summary: "Tóm tắt CMS" } : {}),
    };
    await expect(
      call(
        endpoint,
        "PATCH",
        {
          revision: state.revision,
          content: { ...content, linkUrl: "javascript:invalid" },
        },
        admin,
      ),
      400,
    );
    let edit = await (
      await expect(
        call(endpoint, "PATCH", { revision: state.revision, content }, admin),
        200,
      )
    ).json();
    edit = await (
      await expect(
        fetchLocal(`/api${endpoint}/image?revision=${edit.revision}`, {
          method: "PUT",
          headers: { cookie: admin, "content-type": "image/png" },
          body: png,
        }),
        200,
      )
    ).json();
    await expect(fetchLocal(imagePath), 404);
    await expect(
      call(`${endpoint}/publish`, "POST", { revision: state.revision }, admin),
      409,
    );
    edit = await (
      await expect(
        call(`${endpoint}/publish`, "POST", { revision: edit.revision }, admin),
        200,
      )
    ).json();
    const published = await (await expect(fetchLocal(itemPath), 200)).text();
    assert.ok(
      published.includes(content.title) &&
        published.includes(content.body) &&
        published.includes(`href="${content.linkUrl}"`) &&
        published.includes(imagePath),
    );
    assert.deepEqual(
      Buffer.from(
        await (await expect(fetchLocal(imagePath), 200)).arrayBuffer(),
      ),
      png,
    );
    assert.match(
      await (await expect(fetchLocal(`/${kind}`), 200)).text(),
      new RegExp(content.title),
    );
    if (kind === "news") {
      await expect(
        call(`/admin/news/${itemSlug}/withdraw`, "POST", {}, admin),
        200,
      );
      await expect(fetchLocal(itemPath), 404);
      await expect(fetchLocal(imagePath), 404);
      await expect(
        call(`${endpoint}/publish`, "POST", { revision: edit.revision }, admin),
        200,
      );
      edit = await (
        await expect(call(endpoint, "GET", undefined, admin), 200)
      ).json();
      await expect(fetchLocal(imagePath), 200);
    }
    const updated = {
      ...content,
      body: `Nội dung mới ${itemSlug}`,
      linkUrl: "/alumni-card",
    };
    edit = await (
      await expect(
        call(
          endpoint,
          "PATCH",
          { revision: edit.revision, content: updated },
          admin,
        ),
        200,
      )
    ).json();
    edit = await (
      await expect(
        call(
          `${endpoint}/image?revision=${edit.revision}`,
          "DELETE",
          undefined,
          admin,
        ),
        200,
      )
    ).json();
    const before = await (await expect(fetchLocal(itemPath), 200)).text();
    assert.ok(
      before.includes(content.body) &&
        !before.includes(updated.body) &&
        before.includes(`href="${content.linkUrl}"`),
    );
    await expect(fetchLocal(imagePath), 200);
    await expect(
      call(`${endpoint}/publish`, "POST", { revision: edit.revision }, admin),
      200,
    );
    assert.match(
      await (await expect(fetchLocal(itemPath), 200)).text(),
      new RegExp(updated.body),
    );
    await expect(fetchLocal(imagePath), 404);
    if (kind === "events") {
      await expect(
        call(
          `/admin/events/${itemSlug}`,
          "PATCH",
          {
            location: initial.location,
            startsAt: initial.startsAt,
            capacity: initial.capacity,
            guestLimit: 0,
          },
          admin,
        ),
        200,
      );
      const eventDetails = await (await expect(call(itemPath), 200)).json();
      assert.equal(eventDetails.description, updated.body);
      assert.equal(eventDetails.capacity, initial.capacity);
    }
  }
  console.log(
    "Local per-article and per-event CMS draft, images, links and publishing passed",
  );
}

const seoOrigin = process.env.SMOKE_SEO_ORIGIN;
if (seoOrigin) {
  const html = async (path) => (await expect(fetchLocal(path), 200)).text();
  const [home, account, staff, careerTab, news, event, robots, sitemap] =
    await Promise.all([
      html("/"),
      html("/account"),
      html("/admin/login"),
      html("/career?tab=profile"),
      html(newsPath),
      html(`/events/${openSlug}`),
      html("/robots.txt"),
      html("/sitemap.xml"),
    ]);
  const noindex = '<meta name="robots" content="noindex, nofollow"';
  const canonical = (path) =>
    `<link rel="canonical" href="${seoOrigin}${path}"`;
  assert.ok(
    home.includes(canonical("/")),
    "Homepage canonical must match the root sitemap URL",
  );
  assert.ok(
    home.includes('content="index, follow"'),
    "Indexable homepage should permit indexing",
  );

  assert.ok(
    news.includes(canonical(newsPath)) && news.includes('content="article"'),
  );
  assert.ok(event.includes(canonical(`/events/${openSlug}`)));
  for (const detail of [news, event]) {
    assert.ok(detail.includes('aria-label="Đường dẫn trang"'));
    assert.ok(detail.includes('"@type":"BreadcrumbList"'));
  }
  assert.ok(news.includes('"@type":"Article"'));
  assert.ok(
    account.includes(noindex) &&
      staff.includes(noindex) &&
      careerTab.includes(noindex),
  );
  assert.ok(
    account.includes('class="site-header"') &&
      !staff.includes('class="site-header"'),
  );
  assert.ok(robots.includes(`Sitemap: ${seoOrigin}/sitemap.xml`));
  assert.ok(sitemap.includes(`${seoOrigin}${newsPath}</loc>`));
  assert.ok(sitemap.includes(`${seoOrigin}/events/${openSlug}</loc>`));
  assert.ok(sitemap.includes(`${seoOrigin}/alumni-card</loc>`));
  for (const privatePath of ["/admin", "/account", "/api/", "?tab="])
    assert.ok(!sitemap.includes(privatePath));
  console.log(
    "Public SEO canonical, social metadata, sitemap, noindex, breadcrumbs and layout isolation passed",
  );
}
