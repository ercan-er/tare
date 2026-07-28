"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { signIn, signUp, signInGoogle, user, configured } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="wrap" style={{ padding: "70px 0" }}>
        <div className="empty">
          <h3>You are already signed in</h3>
          <p>{user.email}</p>
          <Link href="/products" className="btn" style={{ marginTop: 16 }}>Continue shopping</Link>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(email, password);
      router.push("/products");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      const map: Record<string, string> = {
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/invalid-email": "That email address is not valid.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/email-already-in-use": "That email is already registered.",
        "auth/too-many-requests": "Too many attempts. Try again shortly.",
      };
      setError(map[code] ?? (err as Error).message ?? "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap" style={{ padding: "50px 0 90px", maxWidth: 560 }}>
      <span className="eyebrow">Account</span>
      <h1 className="serif" style={{ fontSize: 36, margin: "10px 0 6px", letterSpacing: "-.015em" }}>
        {mode === "in" ? "Sign in" : "Create an account"}
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 26 }}>
        Your cart is tied to your account, so it survives a change of device.
      </p>

      {!configured && (
        <div className="alert info" style={{ marginBottom: 20 }}>
          Firebase environment variables are not set. Fill in the
          <code> NEXT_PUBLIC_FIREBASE_*</code> values in <code>.env.local</code> and restart the server.
        </div>
      )}

      <form className="form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            disabled={!configured}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password" type="password" required minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password} onChange={(e) => setPassword(e.target.value)}
            disabled={!configured}
          />
        </div>

        {error && <div className="alert err">{error}</div>}

        <button className="btn" type="submit" disabled={busy || !configured} data-testid="submit-login">
          {busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          className="btn ghost"
          disabled={busy || !configured}
          onClick={async () => {
            setError(null);
            try { await signInGoogle(); router.push("/products"); }
            catch (err) { setError((err as Error).message); }
          }}
        >
          Continue with Google
        </button>
      </form>

      <p style={{ marginTop: 22, fontSize: 14, color: "var(--muted)" }}>
        {mode === "in" ? "No account yet? " : "Already have an account? "}
        <button
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); }}
          style={{ background: "none", border: "none", padding: 0, color: "var(--brass)", textDecoration: "underline" }}
        >
          {mode === "in" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
