import assert from "node:assert/strict";
import { test } from "node:test";
import { profileExtras } from "../src/career-profile.ts";

test("validates new profile fields without clearing omitted data", () => {
  assert.deepEqual(
    profileExtras({ education: " Văn Lang ", skills: "React, TypeScript" }),
    {
      education: "Văn Lang",
      skills: "React, TypeScript",
    },
  );
  assert.deepEqual(profileExtras({ fullName: "Legacy profile" }), {});
  assert.deepEqual(profileExtras({ projects: "" }), { projects: "" });
  for (const input of [
    { skills: "a".repeat(1501) },
    { location: {} },
    { linkedin: "javascript:alert(1)" },
    { linkedin: "https://linkedin.com.evil.test/in/a" },
    { linkedin: "https://user:password@linkedin.com/in/a" },
  ])
    assert.throws(() => profileExtras(input));
  assert.equal(
    profileExtras({ linkedin: "https://www.linkedin.com/in/example" }).linkedin,
    "https://www.linkedin.com/in/example",
  );
});

test("accepts bounded JPEG avatars and rejects executable or oversized sources", () => {
  const avatar = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 219, 0, 255, 217]).toString("base64")}`;
  assert.deepEqual(profileExtras({ avatar }), { avatar });
  assert.deepEqual(profileExtras({ avatar: "" }), { avatar: "" });
  for (const value of [
    "https://example.test/avatar.jpg",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "data:image/jpeg;base64,SGVsbG8=",
    `data:image/jpeg;base64,${"a".repeat(44001)}`,
  ])
    assert.throws(() => profileExtras({ avatar: value }));
});
