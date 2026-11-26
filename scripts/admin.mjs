import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { parseEnv } from "node:util";

const local = parseEnv(readFileSync(".env", "utf8"));
if (local.APP_ENV !== "dev")
  throw new Error("Admin development requires APP_ENV=dev");
const port = Number(process.env.ADMIN_PORT || local.ADMIN_PORT || "8082");
const backendPort = Number(
  process.env.BACKEND_PORT || local.BACKEND_PORT || "8081",
);
const websitePort = Number(process.env.HTTP_PORT || local.HTTP_PORT || "8080");
if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535 ||
  port === backendPort ||
  port === websitePort
)
  throw new Error(
    "ADMIN_PORT must be a valid port distinct from HTTP_PORT and BACKEND_PORT",
  );

// Kiểm tra cổng trước để tránh tự chuyển sang địa chỉ khác.
const probe = createServer();
try {
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
} catch (error) {
  if (error.code !== "EADDRINUSE") {
    console.error(`Không mở được cổng Admin ${port}. ${error.message}`);
    process.exit(1);
  }
  const existing = await fetch(`http://127.0.0.1:${port}/admin`, {
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  const html = existing?.ok ? await existing.text() : "";
  if (html.includes("cms-shell") && html.includes("Alumni Hub")) {
    console.log(`Admin Alumni Hub đã chạy: http://localhost:${port}/admin`);
    console.log(
      "Mở link trên để sử dụng. Muốn khởi động lại, nhấn Ctrl+C trong Terminal của phiên Admin cũ.",
    );
    process.exit(0);
  }
  console.error(
    `Cổng ${port} đang được sử dụng. Dừng phiên cũ hoặc chọn ADMIN_PORT khác trong .env rồi chạy lại npm run admin.`,
  );
  process.exit(1);
}
const ready = await fetch(`http://127.0.0.1:${backendPort}/ready`, {
  signal: AbortSignal.timeout(3000),
}).catch(() => null);
if (!ready?.ok)
  throw new Error("Start npm run dev in another terminal before npm run admin");

console.log(`Admin: http://localhost:${port}/admin`);
const frontend = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "apps/frontend",
    "-H",
    "127.0.0.1",
    "-p",
    String(port),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      BACKEND_URL: `http://127.0.0.1:${backendPort}`,
      ALUMNI_ADMIN_DEV: "true",
    },
  },
);
frontend.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
frontend.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => frontend.kill());
