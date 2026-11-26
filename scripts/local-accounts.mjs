import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const env = parseEnv(readFileSync(".env", "utf8"));
if (env.APP_ENV !== "dev")
  throw new Error("Local accounts require APP_ENV=dev in .env");
const entries = [];
for (const role of ["ADMIN", "ALUMNI", "REVIEWER"]) {
  const key = `LOCAL_${role}_PASSWORD`;
  if (!env[key]) entries.push(`${key}=${randomBytes(24).toString("hex")}`);
}
if (!env.LOCAL_AUTH_ENABLED) entries.push("LOCAL_AUTH_ENABLED=true");
if (entries.length > 0) appendFileSync(".env", `\n${entries.join("\n")}\n`);
console.log(
  "Local credentials are in .env. Set LOCAL_AUTH_ENABLED=true and restart the local services.",
);
