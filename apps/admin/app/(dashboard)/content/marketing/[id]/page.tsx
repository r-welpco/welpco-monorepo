"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getMarketingPhrase, updateMarketingPhrase, deleteMarketingPhrase, type AdminMarketingPhrase } from "@/lib/services/admin-content-service";

const PHRASE_TYPES = ["cta", "slogan", "tagline"];

export default function EditMarketingPhrasePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<AdminMarketingPhrase | null>(null);
  const [phraseText, setPhraseText] = useState("");
  const [phraseType, setPhraseType] = useState("cta");
  const [usageContext, setUsageContext] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getMarketingPhrase(params.id).then((i) => { setItem(i); setPhraseText(i.phraseText); setPhraseType(i.phraseType); setUsageContext(i.usageContext ?? ""); setIsActive(i.isActive); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed")).finally(() => setLoading(false));
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null); setSaving(true);
    try { await updateMarketingPhrase(params.id, { phraseText, phraseType, usageContext: usageContext || undefined, isActive }); setSuccess("Saved."); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this phrase?")) return; setSaving(true);
    try { await deleteMarketingPhrase(params.id); router.push("/content"); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); setSaving(false); }
  }

  if (loading) return <p>Loading...</p>;
  if (!item) return <div><Link href="/content">&larr; Content</Link><p className="err">Not found.</p></div>;

  return (
    <div>
      <p><Link href="/content">&larr; Content</Link></p>
      <h1 style={{ marginTop: 0 }}>Edit Marketing Phrase</h1>
      <form onSubmit={handleSave} className="admin-card">
        <div className="field"><label>Text</label><textarea className="admin-input" value={phraseText} onChange={(e) => setPhraseText(e.target.value)} rows={3} required /></div>
        <div className="field"><label>Type</label>
          <select className="admin-input" value={phraseType} onChange={(e) => setPhraseType(e.target.value)}>
            {PHRASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field"><label>Usage context</label><input className="admin-input" value={usageContext} onChange={(e) => setUsageContext(e.target.value)} placeholder="e.g. homepage, registration" /></div>
        <div className="field"><label><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label></div>
        {error ? <p className="err">{error}</p> : null}{success ? <p className="ok">{success}</p> : null}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" className="btn" onClick={handleDelete} disabled={saving} style={{ color: "var(--admin-danger, #e55)" }}>Delete</button>
        </div>
      </form>
    </div>
  );
}
