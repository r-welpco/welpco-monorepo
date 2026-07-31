import Link from "next/link";
import { AdminDateTime } from "@/components/admin-date-time";
import { listQuestions, type AdminQuestion } from "@/lib/services/admin-questions-service";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  let questions: AdminQuestion[];
  let err: string | null = null;
  try {
    questions = await listQuestions();
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load questions";
    questions = [];
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginTop: 0 }}>Service Questions</h1>
        <Link href="/questions/new" className="btn btn-primary">
          Create question
        </Link>
      </div>

      <p style={{ color: "var(--admin-muted)" }}>
        {questions.length} question{questions.length !== 1 ? "s" : ""}
      </p>
      {err ? <p className="err">{err}</p> : null}

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Type</th>
              <th>Order</th>
              <th>Options</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>
                  No questions yet.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.label}</td>
                  <td>
                    <span className="badge">{q.type}</span>
                  </td>
                  <td>{q.displayOrder}</td>
                  <td>
                    {q.type === "choice" && q.options
                      ? `${q.options.length} option${q.options.length !== 1 ? "s" : ""}`
                      : "—"}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>
                    <AdminDateTime value={q.createdAt} dateOnly />
                  </td>
                  <td>
                    <Link href={`/questions/${q.id}`}>Edit</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
