import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "pg";
import { homepageStore } from "../src/homepage.ts";

test("rejects executable and protocol-relative career links before saving CMS content", async () => {
  let writes = 0;
  const store = homepageStore({
    query: async () => {
      writes++;
      return { rowCount: 1, rows: [{ revision: 1 }] };
    },
  } as unknown as Pool);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//external.example",
  ]) {
    await assert.rejects(
      () => store.save({ revision: 0, content: { career1Url: url } }),
      { message: "invalid_page_link", status: 400 },
    );
  }
  assert.equal(writes, 0);
  await store.save({
    revision: 0,
    content: { career1Url: "/career?tab=recruit" },
  });
  await store.save({
    revision: 0,
    content: { career1Url: "https://ejob.vlu.edu.vn/" },
  });
  assert.equal(writes, 2);
});
