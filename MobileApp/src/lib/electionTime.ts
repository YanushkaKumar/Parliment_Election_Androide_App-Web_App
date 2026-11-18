import type { Election } from "./types";

/**
 * Mirrors functions/src/electionWindow.js. Sri Lanka (Asia/Colombo) is UTC+05:30 with no
 * daylight saving, so a fixed offset is exact and avoids relying on Intl time-zone support.
 */
const OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
export const MAX_VOTES = 3;
export const DEFAULT_START = "09:00";
export const DEFAULT_END = "16:00";

export type Status = "upcoming" | "open" | "closed" | "invalid";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, "0");

export function colomboNow(now = Date.now()) {
  const d = new Date(now + OFFSET_MS);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

const norm = (t: string | undefined, fallback: string) => (t && TIME_RE.test(t) ? t : fallback);

export function electionStatus(e: Pick<Election, "date" | "startTime" | "endTime">, now = Date.now()): Status {
  if (!e?.date || !DATE_RE.test(e.date)) return "invalid";
  const start = norm(e.startTime, DEFAULT_START);
  const end = norm(e.endTime, DEFAULT_END);
  const local = colomboNow(now);
  if (e.date > local.date) return "upcoming";
  if (e.date < local.date) return "closed";
  if (local.time < start) return "upcoming";
  if (local.time >= end) return "closed";
  return "open";
}

/** Epoch ms when voting closes on the election day. */
export function closesAt(e: Election): number {
  const [y, m, d] = e.date.split("-").map(Number);
  const [hh, mm] = norm(e.endTime, DEFAULT_END).split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - OFFSET_MS;
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : date;
}
