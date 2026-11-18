// firebase/auth re-exports @firebase/auth, whose React Native build (picked by Metro via the
// "react-native" export condition) provides getReactNativePersistence. The firebase/auth
// typings don't declare it, so declare it here.
import type { Persistence, ReactNativeAsyncStorage } from "firebase/auth";

declare module "firebase/auth" {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
