import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getCategoriesByParent } from "@/lib/services/admin-categories-service";
import { CategoryForm } from "./category-form";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let category;
  let children;
  try {
    category = await getCategory(id);
    children = await getCategoriesByParent(id);
  } catch { notFound(); }

  return (
    <div>
      <p><Link href="/categories">&larr; Categories</Link></p>
      <h1 style={{ marginTop: 0 }}>{category.name}</h1>
      <p style={{ color: "var(--admin-muted)" }}>
        Level {category.level} &middot; <span className="badge">{category.isActive ? "Active" : "Inactive"}</span>
        {category.parentId ? <> &middot; Parent: <Link href={`/categories/${category.parentId}`}>{category.parentId}</Link></> : null}
      </p>
      <CategoryForm category={category} />
      {children.length > 0 ? (
        <>
          <h2 style={{ marginTop: "2rem" }}>Child Categories ({children.length})</h2>
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Level</th><th>Order</th><th>Status</th><th /></tr></thead>
              <tbody>
                {children.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td><td>{c.level}</td><td>{c.displayOrder}</td>
                    <td><span className="badge">{c.isActive ? "Active" : "Inactive"}</span></td>
                    <td><Link href={`/categories/${c.id}`}>Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
