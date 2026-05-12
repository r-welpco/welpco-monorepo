"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAdminUser } from "@/lib/services/admin-users-service";

export default function CreateAdminUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const user = await createAdminUser(email, password);
      router.push(`/users/${user.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin user");
      setLoading(false);
    }
  }

  return (
    <div>
      <p><Link href="/users">&larr; Users</Link></p>
      <h1 style={{ marginTop: 0 }}>Create Admin User</h1>
      <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 480 }}>
        <div className="field">
          <label>Email</label>
          <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="admin-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input className="admin-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>
        {error ? <p className="err">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
          {loading ? "Creating..." : "Create admin account"}
        </button>
      </form>
    </div>
  );
}
