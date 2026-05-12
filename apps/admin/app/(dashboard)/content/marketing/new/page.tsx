"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createMarketingPhrase } from "@/lib/services/admin-content-service";

const PHRASE_TYPES = ["cta", "slogan", "tagline"];

export default function NewMarketingPhrasePage() {
  const router = useRouter();
  const [phraseText, setPhraseText] = useState("");
  const [phraseType, setPhraseType] = useState("cta");
  const [usageContext, setUsageContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { const item = await createMarketingPhrase({ phraseText, phraseType, usageContext: usageContext || undefined }); router.push(`/content/marketing/${item.id}`); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); setLoading(false); }
  }

  return (
    <div>
      <p><Link href="/content">&larr; Content</Link></p>
      <h1 style={{ marginTop: 0 }}>Create Marketing Phrase</h1>
      <form onSubmit={handleSubmit} className="admin-card">
        <div className="field"><label>Text</label><textarea className="admin-input" value={phraseText} onChange={(e) => setPhraseText(e.target.value)} rows={3} required /></div>
        <div className="field"><label>Type</label>
          <select className="admin-input" value={phraseType} onChange={(e) => setPhraseType(e.target.value)}>
            {PHRASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field"><label>Usage context</label><input className="admin-input" value={usageContext} onChange={(e) => setUsageContext(e.target.value)} placeholder="e.g. homepage, registration" /></div>
        {error ? <p className="err">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
      </form>
    </div>
  );
}
