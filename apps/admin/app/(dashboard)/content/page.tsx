import Link from "next/link";
import { listStaticContent, type AdminStaticContent } from "@/lib/services/admin-content-service";
import { listFAQItems, type AdminFAQItem } from "@/lib/services/admin-content-service";
import { listMarketingPhrases, type AdminMarketingPhrase } from "@/lib/services/admin-content-service";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  let statics: AdminStaticContent[] = [];
  let faqs: AdminFAQItem[] = [];
  let phrases: AdminMarketingPhrase[] = [];
  let err: string | null = null;
  try {
    [statics, faqs, phrases] = await Promise.all([listStaticContent(), listFAQItems(), listMarketingPhrases()]);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load content";
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Content Management</h1>
      {err ? <p className="err">{err}</p> : null}

      {/* Static Content */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>Static Content ({statics.length})</h2>
        <Link href="/content/static/new" className="btn btn-primary">Create</Link>
      </div>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden", marginTop: "0.5rem" }}>
        <table className="admin-table">
          <thead><tr><th>Type</th><th>Title</th><th>Published</th><th>Version</th><th /></tr></thead>
          <tbody>
            {statics.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--admin-muted)", padding: "1rem" }}>None.</td></tr> : statics.map((s) => (
              <tr key={s.id}>
                <td><span className="badge">{s.contentType}</span></td>
                <td>{s.title}</td>
                <td>{s.isPublished ? "Yes" : "No"}</td>
                <td>{s.version}</td>
                <td><Link href={`/content/static/${s.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ Items */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>FAQ Items ({faqs.length})</h2>
        <Link href="/content/faq/new" className="btn btn-primary">Create</Link>
      </div>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden", marginTop: "0.5rem" }}>
        <table className="admin-table">
          <thead><tr><th>Category</th><th>Question</th><th>Order</th><th>Active</th><th /></tr></thead>
          <tbody>
            {faqs.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--admin-muted)", padding: "1rem" }}>None.</td></tr> : faqs.map((f) => (
              <tr key={f.id}>
                <td><span className="badge">{f.category}</span></td>
                <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.question}</td>
                <td>{f.displayOrder}</td>
                <td>{f.isActive ? "Yes" : "No"}</td>
                <td><Link href={`/content/faq/${f.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Marketing Phrases */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>Marketing Phrases ({phrases.length})</h2>
        <Link href="/content/marketing/new" className="btn btn-primary">Create</Link>
      </div>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden", marginTop: "0.5rem" }}>
        <table className="admin-table">
          <thead><tr><th>Type</th><th>Text</th><th>Context</th><th>Active</th><th /></tr></thead>
          <tbody>
            {phrases.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--admin-muted)", padding: "1rem" }}>None.</td></tr> : phrases.map((p) => (
              <tr key={p.id}>
                <td><span className="badge">{p.phraseType}</span></td>
                <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.phraseText}</td>
                <td>{p.usageContext ?? "—"}</td>
                <td>{p.isActive ? "Yes" : "No"}</td>
                <td><Link href={`/content/marketing/${p.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
