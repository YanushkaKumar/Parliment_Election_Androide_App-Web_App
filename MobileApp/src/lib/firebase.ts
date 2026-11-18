import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";

const env = process.env;

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
// Long polling is the reliable transport for Firestore listeners in React Native.
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
/** Must match REGION in functions/index.js. */
export const functions = getFunctions(app, "asia-south1");

export const USING_EMULATORS = env.EXPO_PUBLIC_USE_EMULATORS === "true";
if (USING_EMULATORS) {
  const host = env.EXPO_PUBLIC_EMULATOR_HOST || "10.0.2.2";
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
}

export const api = {
  requestOtp: httpsCallable<{ nic: string }, { maskedEmail: string; expiresInSeconds: number }>(functions, "requestOtp"),
  verifyOtp: httpsCallable<{ nic: string; otp: string }, { token: string; voterId: string; name: string }>(functions, "verifyOtp"),
  castVote: httpsCallable<{ electionId: string; candidateId: string }, { votesUsed: number; votesRemaining: number }>(functions, "castVote"),
};

/** User-facing message for a failed Firebase call. */
export function errorMessage(e: unknown, fallback: string): string {
  const err = e as { code?: string; message?: string };
  if (err?.code === "functions/unavailable" || err?.code === "unavailable") {
    return "No connection. Check your internet and try again.";
  }
  if (err?.code?.startsWith("functions/") && err.code !== "functions/internal" && err.message) {
    // The SDK appends the HTTP status, e.g. "Please wait... [429]"; users don't need it.
    return err.message.replace(/\s*\[\d{3}\]$/, "");
  }
  return fallback;
}
