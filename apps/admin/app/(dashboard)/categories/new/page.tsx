"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCategory, listCategories, type AdminCategory } from "@/lib/services/admin-categories-service";

export default function NewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [parents, setParents] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listCategories(true).then(setParents).catch(() => {}); }, []);

  function flatList(cats: AdminCategory[], prefix = ""): Array<{ id: string; label: string }> {
    return cats.flatMap((c) => [
      { id: c.id, label: prefix ? `${prefix} > ${c.name}` : c.name },
      ...(c.children ? flatList(c.children, prefix ? `${prefix} > ${c.name}` : c.name) : []),
    ]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cat = await createCategory({
        name, description: description || undefined,
        parentId: parentId || null, displayOrder, isActive,
      });
      router.push(`/categories/${cat.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  }

  return (
    <div>
      <p><Link href="/categories">&larr; Categories</Link></p>
      <h1 style={{ marginTop: 0 }}>Create Category</h1>
      <form onSubmit={handleSubmit} className="admin-card">
        <div className="field"><label>Name</label><input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="field"><label>Description</label><textarea className="admin-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
        <div className="field"><label>Parent category</label>
          <select className="admin-input" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None (root)</option>
            {flatList(parents).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="field"><label>Display order</label><input className="admin-input" type="number" min={0} value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} /></div>
        <div className="field"><label><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label></div>
        {error ? <p className="err">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
      </form>
    </div>
  );
}
