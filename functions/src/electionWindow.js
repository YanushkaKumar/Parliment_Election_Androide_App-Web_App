"use strict";

/** Time zone that election dates/times are interpreted in. */
const ELECTION_TIME_ZONE = "Asia/Colombo";
const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "16:00";
const MAX_VOTES_PER_VOTER = 3;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns {date: "YYYY-MM-DD", time: "HH:mm"} for `now` in the given time zone. */
function localDateTime(now, timeZone = ELECTION_TIME_ZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function normalizeTime(value, fallback) {
  return typeof value === "string" && TIME_RE.test(value) ? value : fallback;
}

/**
 * Status of an election at `now`.
 * @param {{date: string, startTime?: string, endTime?: string}} election
 * @returns {"upcoming"|"open"|"closed"|"invalid"}
 */
function electionStatus(election, now = new Date(), timeZone = ELECTION_TIME_ZONE) {
  if (!election || typeof election.date !== "string" || !DATE_RE.test(election.date)) {
    return "invalid";
  }
  const start = normalizeTime(election.startTime, DEFAULT_START_TIME);
  const end = normalizeTime(election.endTime, DEFAULT_END_TIME);
  const local = localDateTime(now, timeZone);

  if (election.date > local.date) return "upcoming";
  if (election.date < local.date) return "closed";
  if (local.time < start) return "upcoming";
  if (local.time >= end) return "closed";
  return "open";
}

module.exports = {
  ELECTION_TIME_ZONE,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME,
  MAX_VOTES_PER_VOTER,
  localDateTime,
  electionStatus,
};
