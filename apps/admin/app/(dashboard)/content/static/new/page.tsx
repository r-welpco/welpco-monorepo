"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createStaticContent } from "@/lib/services/admin-content-service";

const CONTENT_TYPES = ["about_us", "faq", "terms", "privacy", "contact", "homepage"];

export default function NewStaticContentPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { const item = await createStaticContent({ contentType, title, body, isPublished }); router.push(`/content/static/${item.id}`); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); setLoading(false); }
  }

  return (
    <div>
      <p><Link href="/content">&larr; Content</Link></p>
      <h1 style={{ marginTop: 0 }}>Create Static Content</h1>
      <form onSubmit={handleSubmit} className="admin-card">
        <div className="field"><label>Content type</label>
          <select className="admin-input" value={contentType} onChange={(e) => setContentType(e.target.value)}>
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field"><label>Title</label><input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div className="field"><label>Body</label><textarea className="admin-input" value={body} onChange={(e) => setBody(e.target.value)} rows={10} required /></div>
        <div className="field"><label><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published</label></div>
        {error ? <p className="err">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
      </form>
    </div>
  );
}
