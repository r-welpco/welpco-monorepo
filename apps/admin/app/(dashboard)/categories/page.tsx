import Link from "next/link";
import { listCategories, type AdminCategory } from "@/lib/services/admin-categories-service";

export const dynamic = "force-dynamic";

function renderTree(
  categories: AdminCategory[],
  depth = 0,
  /** Stable path so rows stay unique when the API returns duplicate ids in the tree. */
  pathPrefix = "c",
): React.ReactNode[] {
  return categories.flatMap((cat, index) => {
    const rowKey = `${pathPrefix}.${index}.${cat.id}`;
    return [
      <tr key={rowKey}>
        <td style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}>
          {depth > 0 ? "└ " : ""}{cat.name}
        </td>
        <td>{cat.level}</td>
        <td>{cat.displayOrder}</td>
        <td><span className="badge">{cat.isActive ? "Active" : "Inactive"}</span></td>
        <td><Link href={`/categories/${cat.id}`}>Edit</Link></td>
      </tr>,
      ...(cat.children?.length ? renderTree(cat.children, depth + 1, rowKey) : []),
    ];
  });
}

export default async function CategoriesPage() {
  let categories: AdminCategory[];
  let err: string | null = null;
  try {
    categories = await listCategories(true);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load categories";
    categories = [];
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginTop: 0 }}>Service Categories</h1>
        <Link href="/categories/new" className="btn btn-primary">Create category</Link>
      </div>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Level</th><th>Order</th><th>Status</th><th /></tr></thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>No categories.</td></tr>
            ) : renderTree(categories)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
