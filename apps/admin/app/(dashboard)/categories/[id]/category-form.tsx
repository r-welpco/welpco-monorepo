"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCategory, deleteCategory, type AdminCategory } from "@/lib/services/admin-categories-service";

export function CategoryForm({ category }: { category: AdminCategory }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(category.displayOrder);
  const [icon, setIcon] = useState(category.icon ?? "");
  const [isActive, setIsActive] = useState(category.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      await updateCategory(category.id, { name, description, displayOrder, icon: icon || undefined, isActive });
      setSuccess("Saved."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this category? Children must be deleted first.")) return;
    setLoading(true);
    try { await deleteCategory(category.id); router.push("/categories"); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); setLoading(false); }
  }

  return (
    <form onSubmit={handleSave} className="admin-card">
      <div className="field"><label>Name</label><input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div className="field"><label>Description</label><textarea className="admin-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
      <div className="field"><label>Display order</label><input className="admin-input" type="number" min={0} value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} /></div>
      <div className="field"><label>Icon</label><input className="admin-input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon name" /></div>
      <div className="field"><label><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label></div>
      {error ? <p className="err">{error}</p> : null}
      {success ? <p className="ok">{success}</p> : null}
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        <button type="button" className="btn" onClick={handleDelete} disabled={loading} style={{ color: "var(--admin-danger, #e55)" }}>Delete</button>
      </div>
    </form>
  );
}
