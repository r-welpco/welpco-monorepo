"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.error === "Forbidden" ? "Admin access only." : null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error || !res?.ok) {
        setError("Invalid email or password, or account is not an administrator.");
        setLoading(false);
        return;
      }
      router.push("/disputes");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-card" style={{ width: "100%", maxWidth: 400 }}>
      <h1 style={{ marginTop: 0, fontSize: "1.35rem" }}>Staff sign in</h1>
      <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
        Welpco platform administrators only.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="err">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
