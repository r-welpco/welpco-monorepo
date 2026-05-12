"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getStaticContent, updateStaticContent, deleteStaticContent, type AdminStaticContent } from "@/lib/services/admin-content-service";

export default function EditStaticContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<AdminStaticContent | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getStaticContent(params.id).then((i) => { setItem(i); setTitle(i.title); setBody(i.body); setIsPublished(i.isPublished); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed")).finally(() => setLoading(false));
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null); setSaving(true);
    try { await updateStaticContent(params.id, { title, body, isPublished }); setSuccess("Saved."); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this content?")) return; setSaving(true);
    try { await deleteStaticContent(params.id); router.push("/content"); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); setSaving(false); }
  }

  if (loading) return <p>Loading...</p>;
  if (!item) return <div><Link href="/content">&larr; Content</Link><p className="err">Not found.</p></div>;

  return (
    <div>
      <p><Link href="/content">&larr; Content</Link></p>
      <h1 style={{ marginTop: 0 }}>Edit: {item.contentType}</h1>
      <form onSubmit={handleSave} className="admin-card">
        <div className="field"><label>Title</label><input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div className="field"><label>Body</label><textarea className="admin-input" value={body} onChange={(e) => setBody(e.target.value)} rows={10} required /></div>
        <div className="field"><label><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published</label></div>
        {error ? <p className="err">{error}</p> : null}{success ? <p className="ok">{success}</p> : null}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" className="btn" onClick={handleDelete} disabled={saving} style={{ color: "var(--admin-danger, #e55)" }}>Delete</button>
        </div>
      </form>
    </div>
  );
}
