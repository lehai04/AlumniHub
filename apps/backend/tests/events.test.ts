import assert from "node:assert/strict";
import { test } from "node:test";
import { eventDeadlinePassed } from "../src/events.ts";

test("allows registration and cancellation at their exact cutoffs", () => {
  const startsAt = new Date("2030-04-01T10:00:00+07:00");
  for (const hours of [12, 24] as const) {
    const cutoff = startsAt.getTime() - hours * 3_600_000;
    assert.equal(eventDeadlinePassed(startsAt, hours, cutoff - 1), false);
    assert.equal(eventDeadlinePassed(startsAt, hours, cutoff), false);
    assert.equal(eventDeadlinePassed(startsAt, hours, cutoff + 1), true);
  }
});
