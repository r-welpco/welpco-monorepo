"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookingIdJump() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const t = id.trim();
    if (!t) {
      setErr("Enter a booking UUID.");
      return;
    }
    router.push(`/bookings/${t}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="admin-card"
      style={{ maxWidth: 480, display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem", flex: "1 1 200px" }}>
        Open by booking ID
        <input
          className="admin-input"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="UUID"
          style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
        />
      </label>
      <button type="submit" className="btn">
        Go
      </button>
      {err ? (
        <p className="err" style={{ flexBasis: "100%", margin: 0 }}>
          {err}
        </p>
      ) : null}
    </form>
  );
}
