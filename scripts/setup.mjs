import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";

// Tạo thông tin đăng nhập cho môi trường local nếu chưa có tệp .env.
const password = randomBytes(24).toString("hex");
try {
  writeFileSync(
    ".env",
    [
      "APP_ENV=dev",
      `POSTGRES_PASSWORD=${password}`,
      `DATABASE_URL=postgresql://alumni:${password}@127.0.0.1:55432/alumni`,
      "DEV_DB_PORT=55432",
      "HTTP_PORT=8080",
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}

// Chỉ cài Git hook khi chạy ở thư mục gốc Git của dự án.
const gitRoot = spawnSync("git", ["rev-parse", "--show-prefix"], {
  encoding: "utf8",
});
if (gitRoot.status === 0 && !gitRoot.stdout.trim()) {
  const result = spawnSync(
    "git",
    ["config", "--local", "core.hooksPath", "scripts/hooks"],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exitCode = 1;
}
