import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Live Firestore collection (onSnapshot). `filters` = { field: value } equality filters,
 * or null to disable. Loading is derived from whether a snapshot for the current key arrived.
 */
export function useLiveCollection(name, filters = {}) {
  const key = filters ? `${name}:${JSON.stringify(filters)}` : null;
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    if (!key) return undefined;
    const constraints = Object.entries(filters).map(([f, v]) => where(f, "==", v));
    return onSnapshot(
      query(collection(db, name), ...constraints),
      (s) => setSnap({ key, docs: s.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
      (error) => {
        console.error(`Live ${name} failed:`, error);
        setSnap({ key, docs: [], error });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = key && snap?.key === key ? snap : null;
  return { docs: current?.docs ?? [], loading: !!key && !current, error: current?.error ?? null };
}

/** Sri Lanka is UTC+05:30 with no DST. Mirrors functions/src/electionWindow.js. */
const OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");
export function electionStatus(e, now = Date.now()) {
  if (!e?.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return "invalid";
  const d = new Date(now + OFFSET_MS);
  const today = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  const start = e.startTime || "09:00";
  const end = e.endTime || "16:00";
  if (e.date > today) return "upcoming";
  if (e.date < today) return "closed";
  if (time < start) return "upcoming";
  if (time >= end) return "closed";
  return "open";
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export const imageSrc = (b64) =>
  !b64 ? null : b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
