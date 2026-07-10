"use client";

import { useEffect, useState } from "react";
import { getPaymentCaptureDelay, setPaymentCaptureDelay } from "@/lib/services/admin-settings-service";

export default function AdminSettingsPage() {
  const [minutes, setMinutes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPaymentCaptureDelay()
      .then((r) => {
        if (!cancelled) {
          setMinutes(String(r.value));
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to load setting");
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      await setPaymentCaptureDelay(minutes.trim());
      setOk("Saved. Capture scheduler will use this delay for new completions.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <p style={{ color: "var(--admin-muted)", maxWidth: 560 }}>
        Payment capture delay: minutes to wait after service completion before Stripe capture is eligible (see domain
        catalog).
      </p>
      {!loaded ? <p style={{ color: "var(--admin-muted)" }}>Loading…</p> : null}
      {err ? <p className="err">{err}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
      <form
        onSubmit={onSave}
        className="admin-card"
        style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Minutes
          <input
            className="admin-input"
            type="number"
            min={0}
            step={1}
            required
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy || !loaded}>
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
