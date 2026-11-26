import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { parseEnv } from "node:util";

const local = parseEnv(readFileSync(".env", "utf8"));
// Lệnh dev chỉ chạy migration trên PostgreSQL được publish ra loopback.
const database = new URL(local.DATABASE_URL ?? "");
if (
  local.APP_ENV !== "dev" ||
  !["127.0.0.1", "localhost", "[::1]"].includes(database.hostname)
)
  throw new Error(
    "Dev requires a loopback PostgreSQL URL and APP_ENV=dev in .env",
  );
const backendPort = local.BACKEND_PORT || "8081";
const frontendPort = local.HTTP_PORT || "8080";
if (backendPort === frontendPort)
  throw new Error("BACKEND_PORT and HTTP_PORT must be different");
// Dừng trước khi mở tiến trình con nếu đã có phiên chạy trên cùng cổng.
for (const [name, port] of [
  ["Website", frontendPort],
  ["Backend", backendPort],
]) {
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    throw new Error(`${name}: cổng không hợp lệ.`);
  const probe = createServer();
  try {
    await new Promise((resolve, reject) => {
      probe.once("error", reject);
      probe.listen(Number(port), "127.0.0.1", () => probe.close(resolve));
    });
  } catch {
    console.error(
      `${name} đang có tiến trình sử dụng cổng ${port}. Nếu Alumni Hub đã chạy, mở http://localhost:${frontendPort} và dùng npm run admin ở Terminal khác. Muốn khởi động lại, nhấn Ctrl+C tại Terminal của phiên dev cũ.`,
    );
    process.exit(1);
  }
}
const env = { ...process.env, ...local, HOST: "127.0.0.1", PORT: backendPort };

const databaseStart = spawnSync(
  "docker",
  ["compose", "up", "-d", "--wait", "db"],
  { stdio: "inherit", env },
);
if (databaseStart.status !== 0) process.exit(databaseStart.status ?? 1);
const migration = spawnSync(
  process.execPath,
  ["apps/backend/scripts/migrate.ts"],
  { stdio: "inherit", env },
);
if (migration.status !== 0) process.exit(migration.status ?? 1);

const backend = spawn(
  process.execPath,
  ["--watch", "apps/backend/src/main.ts"],
  { stdio: "inherit", env },
);
const frontend = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "apps/frontend",
    "-H",
    "127.0.0.1",
    "-p",
    frontendPort,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, BACKEND_URL: `http://127.0.0.1:${backendPort}` },
  },
);
for (const [processToWatch, sibling] of [
  [backend, frontend],
  [frontend, backend],
]) {
  processToWatch.on("error", () => {
    process.exitCode = 1;
    sibling.kill();
  });
  processToWatch.on("exit", (status) => {
    if (status) process.exitCode = status;
    sibling.kill();
  });
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    frontend.kill();
    backend.kill();
  });
}
