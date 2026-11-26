import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

// Không đọc .env: mọi thao tác ghi chỉ dùng PostgreSQL tạm của lần kiểm tra này.
const container = `alumni-check-${randomUUID()}`;
const password = () => randomBytes(24).toString("hex");
const dbPassword = password();
const children = [];
let databaseStarted = false;
const env = {
  ...process.env,
  APP_ENV: "dev",
  HOST: "127.0.0.1",
  LOCAL_AUTH_ENABLED: "true",
  LOCAL_ADMIN_PASSWORD: password(),
  LOCAL_ALUMNI_PASSWORD: password(),
  LOCAL_REVIEWER_PASSWORD: password(),
  ALUMNI_ADMIN_DEV: "false",
  PUBLIC_SITE_URL: "https://alumni.example.test",
  PUBLIC_INDEXING_ENABLED: "true",
  LOG_LEVEL: "warn",
};

async function run(command, args, capture = false) {
  const child = spawn(command, args, {
    env,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  let output = "";
  if (capture)
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} kết thúc với mã ${code}`)),
    );
  });
  return output.trim();
}
const node = (...args) => run(process.execPath, args);
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function ready(url) {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (children.some((child) => child.exitCode !== null))
      throw new Error("Máy chủ kiểm thử đã dừng trước khi sẵn sàng.");
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2000),
    }).catch(() => null);
    if (response?.ok) return;
    await delay(500);
  }
  throw new Error(`Máy chủ chưa sẵn sàng: ${url}`);
}
function start(...args) {
  const child = spawn(process.execPath, args, { env, stdio: "inherit" });
  child.on("error", (error) => console.error(error.message));
  children.push(child);
}

try {
  assert.ok(
    process.env.npm_execpath,
    "Chạy bằng npm run check để dùng đúng npm của dự án.",
  );
  for (const task of ["lint", "typecheck", "test", "build"])
    await node(process.env.npm_execpath, "run", task);
  await node(process.env.npm_execpath, "audit", "--audit-level=high");
  await run("docker", [
    "run",
    "--detach",
    "--rm",
    "--name",
    container,
    "--env",
    "POSTGRES_USER=alumni",
    "--env",
    `POSTGRES_PASSWORD=${dbPassword}`,
    "--env",
    "POSTGRES_DB=alumni",
    "--publish",
    "127.0.0.1::5432",
    "--tmpfs",
    "/var/lib/postgresql/data:rw,size=256m",
    "postgres:17.12-bookworm",
  ]);
  databaseStarted = true;
  const address = await run("docker", ["port", container, "5432/tcp"], true);
  assert.match(address, /^127\.0\.0\.1:\d+$/);
  env.DATABASE_URL = `postgresql://alumni:${dbPassword}@${address}/alumni`;
  await run("docker", [
    "exec",
    container,
    "sh",
    "-c",
    "until pg_isready -h 127.0.0.1 -U alumni -d alumni; do sleep 1; done",
  ]);
  // Kiểm tra chạy lại migration và seed không tạo trùng dữ liệu.
  for (const script of ["migrate", "seed"])
    for (let pass = 0; pass < 2; pass++)
      await node(`apps/backend/scripts/${script}.ts`);
  const backendPort = await freePort();
  let frontendPort = await freePort();
  while (frontendPort === backendPort) frontendPort = await freePort();
  env.PORT = String(backendPort);
  env.BACKEND_URL = `http://127.0.0.1:${backendPort}`;
  env.SMOKE_URL = `http://127.0.0.1:${frontendPort}`;
  env.SMOKE_HOMEPAGE = "1";
  env.SMOKE_SEO_ORIGIN = env.PUBLIC_SITE_URL;
  start("apps/backend/dist/src/main.js");
  await ready(`${env.BACKEND_URL}/ready`);
  start(
    "node_modules/next/dist/bin/next",
    "start",
    "apps/frontend",
    "-H",
    "127.0.0.1",
    "-p",
    String(frontendPort),
  );
  await ready(`${env.SMOKE_URL}/ready`);
  await node("scripts/smoke.mjs");
  console.log(
    "Đã đạt toàn bộ kiểm tra. Database đang dùng và .env được giữ nguyên.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Chỉ dừng các tiến trình và container do chính lần kiểm tra này tạo.
  for (const child of children) child.kill();
  if (databaseStarted)
    await run("docker", ["stop", container]).catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
