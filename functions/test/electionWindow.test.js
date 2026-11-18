"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { electionStatus, localDateTime } = require("../src/electionWindow");

// 2026-03-10 10:30 in Asia/Colombo (UTC+05:30) is 05:00 UTC.
const at = (iso) => new Date(iso);

test("localDateTime converts to Asia/Colombo", () => {
  assert.deepEqual(localDateTime(at("2026-03-10T05:00:00Z")), { date: "2026-03-10", time: "10:30" });
  // 20:00 UTC on the 9th is already 01:30 on the 10th in Colombo.
  assert.deepEqual(localDateTime(at("2026-03-09T20:00:00Z")), { date: "2026-03-10", time: "01:30" });
});

test("default 09:00-16:00 window", () => {
  const e = { date: "2026-03-10" };
  assert.equal(electionStatus(e, at("2026-03-10T03:29:00Z")), "upcoming"); // 08:59
  assert.equal(electionStatus(e, at("2026-03-10T03:30:00Z")), "open"); // 09:00
  assert.equal(electionStatus(e, at("2026-03-10T10:29:00Z")), "open"); // 15:59
  assert.equal(electionStatus(e, at("2026-03-10T10:30:00Z")), "closed"); // 16:00
});

test("other days", () => {
  const e = { date: "2026-03-10" };
  assert.equal(electionStatus(e, at("2026-03-09T05:00:00Z")), "upcoming");
  assert.equal(electionStatus(e, at("2026-03-11T05:00:00Z")), "closed");
});

test("custom times and bad input", () => {
  const e = { date: "2026-03-10", startTime: "07:00", endTime: "19:00" };
  assert.equal(electionStatus(e, at("2026-03-10T01:45:00Z")), "open"); // 07:15
  assert.equal(electionStatus(e, at("2026-03-10T13:00:00Z")), "open"); // 18:30
  assert.equal(electionStatus({ date: "2026-03-10", startTime: "bogus" }, at("2026-03-10T03:00:00Z")), "upcoming");
  assert.equal(electionStatus({ date: "03/10/26" }), "invalid");
  assert.equal(electionStatus(null), "invalid");
});
