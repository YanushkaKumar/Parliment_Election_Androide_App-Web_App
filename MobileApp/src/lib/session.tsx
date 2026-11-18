import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "./firebase";

type Session = { user: User | null; voterId: string | null; ready: boolean; logout: () => Promise<void> };

const SessionContext = createContext<Session>({ user: null, voterId: null, ready: false, logout: async () => {} });

/** Voters sign in with a custom token whose uid is "voter_<voterDocId>". */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u?.uid.startsWith("voter_") ? u : null);
        setReady(true);
      }),
    [],
  );

  const voterId = user ? user.uid.slice("voter_".length) : null;
  return (
    <SessionContext.Provider value={{ user, voterId, ready, logout: () => signOut(auth) }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
