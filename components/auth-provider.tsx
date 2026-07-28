"use client";

import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import {
  onAuthStateChanged, signOut as fbSignOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, type User,
} from "firebase/auth";
import { auth, googleProvider, firebaseConfigured } from "@/lib/firebase-client";

type Ctx = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  token: () => Promise<string | null>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth(), (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      loading,
      configured: firebaseConfigured,
      signIn: async (e, p) => { await signInWithEmailAndPassword(auth(), e, p); },
      signUp: async (e, p) => { await createUserWithEmailAndPassword(auth(), e, p); },
      signInGoogle: async () => { await signInWithPopup(auth(), googleProvider); },
      signOut: async () => { await fbSignOut(auth()); },
      token: async () => (user ? user.getIdToken() : null),
    }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider.");
  return c;
}
