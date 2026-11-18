import {
  collection, doc, onSnapshot, query, where,
  type DocumentData, type QueryConstraint,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

type Live<T> = { data: T; loading: boolean; error: Error | null };
type Snapshot<T> = { key: string; data: T; error: Error | null };

/**
 * Live Firestore document (onSnapshot). `path` null = disabled.
 * Loading is derived: true until a snapshot for the *current* path has arrived.
 */
export function useLiveDoc<T>(path: string | null, map: (id: string, d: DocumentData) => T): Live<T | null> {
  const [snap, setSnap] = useState<Snapshot<T | null> | null>(null);
  useEffect(() => {
    if (!path) return;
    return onSnapshot(
      doc(db, path),
      (s) => setSnap({ key: path, data: s.exists() ? map(s.id, s.data()) : null, error: null }),
      (error) => setSnap({ key: path, data: null, error }),
    );
    // `map` is a module-level function; only the path decides the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  const current = path !== null && snap?.key === path ? snap : null;
  return { data: current?.data ?? null, loading: path !== null && !current, error: current?.error ?? null };
}

/** Live Firestore query with equality filters. `filters` null = disabled. */
export function useLiveQuery<T>(
  collectionName: string,
  filters: Record<string, string> | null,
  map: (id: string, d: DocumentData) => T | null,
): Live<T[]> {
  const [snap, setSnap] = useState<Snapshot<T[]> | null>(null);
  const key = filters ? `${collectionName}:${JSON.stringify(filters)}` : null;
  useEffect(() => {
    if (!key || !filters) return;
    const constraints: QueryConstraint[] = Object.entries(filters).map(([f, v]) => where(f, "==", v));
    return onSnapshot(
      query(collection(db, collectionName), ...constraints),
      (s) => setSnap({
        key,
        data: s.docs.map((d) => map(d.id, d.data())).filter((x): x is T => x !== null),
        error: null,
      }),
      (error) => setSnap({ key, data: [], error }),
    );
    // The key encodes collection + filters; `map` is a module-level function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const current = key !== null && snap?.key === key ? snap : null;
  return { data: current?.data ?? [], loading: key !== null && !current, error: current?.error ?? null };
}

/** Re-renders every `ms` milliseconds; returns the current time. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
