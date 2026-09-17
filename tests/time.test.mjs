import assert from "node:assert/strict";
import test from "node:test";
import { formatKickoff, validTimeZone } from "../app/lib/time.ts";

test("defaults to Eastern and follows daylight saving time", () => {
  assert.equal(formatKickoff("2026-09-18T00:15:00Z"), "Thu, Sep 17, 8:15 PM EDT");
  assert.equal(formatKickoff("2026-12-18T01:15:00Z"), "Thu, Dec 17, 8:15 PM EST");
});

test("converts the same kickoff to regional time including date rollover", () => {
  assert.equal(formatKickoff("2026-09-18T00:15:00Z", "America/Los_Angeles"), "Thu, Sep 17, 5:15 PM PDT");
  assert.equal(formatKickoff("2026-09-18T00:15:00Z", "Asia/Tokyo"), "Fri, Sep 18, 9:15 AM GMT+9");
  assert.equal(formatKickoff("2026-09-18T00:15:00Z", "Asia/Kolkata"), "Fri, Sep 18, 5:45 AM GMT+5:30");
});

test("handles both sides of the Eastern DST transitions", () => {
  assert.match(formatKickoff("2026-03-08T06:30:00Z"), /1:30 AM EST$/);
  assert.match(formatKickoff("2026-03-08T07:30:00Z"), /3:30 AM EDT$/);
  assert.match(formatKickoff("2026-11-01T05:30:00Z"), /1:30 AM EDT$/);
  assert.match(formatKickoff("2026-11-01T06:30:00Z"), /1:30 AM EST$/);
});

test("recognizes valid regional settings and rejects invalid zones", () => {
  assert.equal(validTimeZone("America/New_York"), true);
  assert.equal(validTimeZone("Asia/Tokyo"), true);
  assert.equal(validTimeZone("not-a-timezone"), false);
});
