import { applicationStore } from "./applications.ts";
import { careerStore } from "./career.ts";
import { communityStore } from "./community.ts";
import { readConfig } from "./config.ts";
import { checkReadiness, createPool } from "./database.ts";
import { eventStore } from "./events.ts";
import { homepageStore } from "./homepage.ts";
import { createHttpServer } from "./http.ts";
import { createLogger } from "./logger.ts";
import { newsStore } from "./news.ts";
import { passwordResetStore } from "./password-reset.ts";
import { serviceContentStore } from "./service-content.ts";

// Điểm bắt đầu của ứng dụng. Đọc cấu hình, chuẩn bị kết nối PostgreSQL và mở cổng HTTP.
function start() {
  const config = readConfig(process.env);
  const log = createLogger(config.logLevel);
  const pool = createPool(config.databaseUrl);
  pool.on("error", () => log("error", "database_pool_error"));
  const server = createHttpServer(
    { version: config.version, commit: config.commit },
    () => checkReadiness(pool),
    log,
    eventStore(pool),
    config.localPasswords,
    config.appEnv !== "production" ? applicationStore(pool) : undefined,
    newsStore(pool),
    careerStore(pool),
    communityStore(pool),
    config.localPasswords ? passwordResetStore(pool) : undefined,
    serviceContentStore(pool),
    (page, item) => homepageStore(pool, page, item),
    {
      staffPasswords: config.staffPasswords,
      secureCookies: config.appEnv !== "dev",
    },
  );
  server.once("error", () => {
    log("error", "server_listen_failed");
    process.exit(1);
  });
  server.listen(config.port, config.host, () =>
    log("info", "server_started", {
      port: config.port,
      version: config.version,
      commit: config.commit,
    }),
  );

  // Ngừng nhận yêu cầu mới trước khi đóng các kết nối cơ sở dữ liệu.
  const shutdown = () => {
    log("info", "server_stopping");
    setTimeout(() => process.exit(1), 9000).unref();
    server.close(() => {
      void pool.end().catch(() => {
        process.exitCode = 1;
      });
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

try {
  start();
} catch (error) {
  createLogger("error")("error", "invalid_configuration", {
    reason: error instanceof Error ? error.message : "Invalid configuration",
  });
  process.exitCode = 1;
}
