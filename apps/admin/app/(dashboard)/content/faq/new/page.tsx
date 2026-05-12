"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createFAQItem } from "@/lib/services/admin-content-service";

const CATEGORIES = ["customer", "welper", "general"];

export default function NewFAQPage() {
  const router = useRouter();
  const [category, setCategory] = useState("general");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { const item = await createFAQItem({ category, question, answer, displayOrder }); router.push(`/content/faq/${item.id}`); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); setLoading(false); }
  }

  return (
    <div>
      <p><Link href="/content">&larr; Content</Link></p>
      <h1 style={{ marginTop: 0 }}>Create FAQ</h1>
      <form onSubmit={handleSubmit} className="admin-card">
        <div className="field"><label>Category</label>
          <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field"><label>Question</label><textarea className="admin-input" value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} required /></div>
        <div className="field"><label>Answer</label><textarea className="admin-input" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} required /></div>
        <div className="field"><label>Display order</label><input className="admin-input" type="number" min={0} value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} /></div>
        {error ? <p className="err">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
      </form>
    </div>
  );
}
