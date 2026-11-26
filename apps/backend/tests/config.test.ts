import assert from "node:assert/strict";
import { test } from "node:test";
import { readConfig } from "../src/config.ts";

const env = {
  APP_ENV: "dev",
  DATABASE_URL: "postgres://tester@localhost/alumni",
};

test("validates runtime configuration and defaults", () => {
  assert.equal(readConfig(env).port, 8081);
  assert.throws(() => readConfig({}), /APP_ENV/);
  assert.throws(
    () => readConfig({ ...env, DATABASE_URL: "https://localhost" }),
    /PostgreSQL/,
  );
  assert.throws(() => readConfig({ ...env, PORT: "70000" }), /PORT/);
  assert.throws(
    () => readConfig({ ...env, APP_ENV: "production" }),
    /verify-full/,
  );
  assert.equal(
    readConfig({
      ...env,
      APP_ENV: "staging",
      DATABASE_URL: `${env.DATABASE_URL}?sslmode=verify-full`,
    }).appEnv,
    "staging",
  );
});

test("local login requires opt-in, separate passwords and the dev environment", () => {
  const local = {
    ...env,
    LOCAL_AUTH_ENABLED: "true",
    LOCAL_ADMIN_PASSWORD: "test-admin-password",
    LOCAL_ALUMNI_PASSWORD: "test-alumni-password",
  };
  assert.ok(readConfig(local).localPasswords);
  assert.throws(() => readConfig({ ...local, LOCAL_ALUMNI_PASSWORD: "" }));
  assert.equal(
    readConfig({
      ...local,
      APP_ENV: "production",
      DATABASE_URL: `${env.DATABASE_URL}?sslmode=verify-full`,
    }).localPasswords,
    undefined,
  );
});

test("staging staff credentials are independent of local accounts", () => {
  const staging = {
    ...env,
    APP_ENV: "staging",
    DATABASE_URL: `${env.DATABASE_URL}?sslmode=verify-full`,
    LOCAL_AUTH_ENABLED: "true",
    LOCAL_ADMIN_PASSWORD: "dev-admin-password",
    LOCAL_ALUMNI_PASSWORD: "dev-alumni-password",
    STAFF_ADMIN_PASSWORD: "staging-only-admin-password",
    STAFF_REVIEWER_PASSWORD: "staging-only-reviewer-password",
  };
  const config = readConfig(staging);
  assert.equal(config.localPasswords, undefined);
  assert.deepEqual(config.staffPasswords, {
    admin: staging.STAFF_ADMIN_PASSWORD,
    reviewer: staging.STAFF_REVIEWER_PASSWORD,
  });
  assert.throws(
    () =>
      readConfig({
        ...staging,
        STAFF_REVIEWER_PASSWORD: staging.STAFF_ADMIN_PASSWORD,
      }),
    /Staff passwords/,
  );
  assert.throws(
    () => readConfig({ ...staging, STAFF_ADMIN_PASSWORD: "" }),
    /Staff passwords/,
  );
});
