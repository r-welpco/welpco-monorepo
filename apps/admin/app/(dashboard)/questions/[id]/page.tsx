import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/lib/services/admin-questions-service";
import { QuestionForm } from "./question-form";
import { AssignmentManager } from "./assignment-manager";

export const dynamic = "force-dynamic";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let question;
  try {
    question = await getQuestion(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <p>
        <Link href="/questions">&larr; All questions</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>{question.label}</h1>
      <p style={{ color: "var(--admin-muted)" }}>
        Type: <span className="badge">{question.type}</span> &middot; Created{" "}
        {new Date(question.createdAt).toLocaleDateString()}
      </p>

      <QuestionForm question={question} />

      <h2 style={{ marginTop: "2rem" }}>Category Assignments</h2>
      <AssignmentManager questionId={question.id} />
    </div>
  );
}
