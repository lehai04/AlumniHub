import type { LocalPasswords, StaffPasswords } from "./local-session.ts";

export const levels = ["debug", "info", "warn", "error"] as const;
type Level = (typeof levels)[number];
export type AppEnvironment = "dev" | "staging" | "production";

// Kiểm tra các biến môi trường trước khi máy chủ mở cổng HTTP.
export function readConfig(env: NodeJS.ProcessEnv) {
  const appEnv = env.APP_ENV;
  if (appEnv !== "dev" && appEnv !== "staging" && appEnv !== "production") {
    throw new Error("APP_ENV must be dev, staging, or production");
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(env.DATABASE_URL ?? "");
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL URL");
  }
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !databaseUrl.hostname ||
    !databaseUrl.username ||
    databaseUrl.pathname.length < 2
  ) {
    throw new Error(
      "DATABASE_URL must identify a PostgreSQL host, user, and database",
    );
  }
  if (
    appEnv !== "dev" &&
    databaseUrl.searchParams.get("sslmode") !== "verify-full"
  ) {
    throw new Error("DATABASE_URL must use sslmode=verify-full outside dev");
  }

  // Dùng cổng và địa chỉ mặc định theo tệp .env.example.
  const port = Number(env.PORT ?? 8081);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  const logLevel = levels.find((level) => level === (env.LOG_LEVEL ?? "info"));
  if (!logLevel)
    throw new Error("LOG_LEVEL must be debug, info, warn, or error");
  const commit = env.COMMIT_SHA ?? "local";
  const version = env.APP_VERSION ?? "0.1.0";
  if (
    !/^(local|[a-f0-9]{40})$/.test(commit) ||
    !/^\d+\.\d+\.\d+$/.test(version)
  ) {
    throw new Error("COMMIT_SHA or APP_VERSION has an invalid format");
  }

  let localPasswords: LocalPasswords | undefined;
  if (appEnv === "dev" && env.LOCAL_AUTH_ENABLED === "true") {
    const admin = env.LOCAL_ADMIN_PASSWORD;
    const alumni = env.LOCAL_ALUMNI_PASSWORD;
    if (
      !admin ||
      !alumni ||
      admin.length < 16 ||
      alumni.length < 16 ||
      admin === alumni
    )
      throw new Error(
        "Local auth requires two distinct passwords of at least 16 characters",
      );
    const reviewer = env.LOCAL_REVIEWER_PASSWORD || undefined;
    if (
      reviewer &&
      (reviewer.length < 16 || reviewer === admin || reviewer === alumni)
    )
      throw new Error(
        "Local reviewer requires a distinct password of at least 16 characters",
      );
    localPasswords = { admin, alumni, reviewer };
  }

  let staffPasswords: StaffPasswords | undefined = localPasswords;
  if (appEnv !== "dev") {
    const admin = env.STAFF_ADMIN_PASSWORD;
    const reviewer = env.STAFF_REVIEWER_PASSWORD || undefined;
    if (admin || reviewer) {
      if (
        !admin ||
        admin.length < 24 ||
        admin.length > 128 ||
        (reviewer &&
          (reviewer.length < 24 || reviewer.length > 128 || reviewer === admin))
      )
        throw new Error(
          "Staff passwords must be distinct and 24 to 128 characters",
        );
      staffPasswords = { admin, reviewer };
    }
  }

  return {
    appEnv,
    databaseUrl: databaseUrl.href,
    host: env.HOST ?? "127.0.0.1",
    port,
    logLevel,
    version,
    commit,
    localPasswords,
    staffPasswords,
  };
}

export type AppConfig = ReturnType<typeof readConfig>;
export type { Level };
