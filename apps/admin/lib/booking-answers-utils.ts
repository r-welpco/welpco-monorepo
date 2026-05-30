import type { AdminQuestion } from "@/lib/services/admin-questions-service";

export interface BookingAnswerRow {
  key: string;
  label: string;
  displayValue: string;
}

export function formatAdminAnswerDisplayValue(
  question: AdminQuestion,
  value: string | number | boolean,
): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (question.type === "choice" && question.options) {
    const strVal = String(value);
    const opt = question.options.find((o) => o.value === strVal);
    if (opt) return opt.label;
  }
  return String(value);
}

export function buildBookingAnswerRows(
  answers: Record<string, string | number | boolean>,
  questions: AdminQuestion[],
): BookingAnswerRow[] {
  const byId = new Map(questions.map((q) => [q.id, q]));

  return Object.entries(answers).map(([questionId, value]) => {
    const question = byId.get(questionId);
    return {
      key: questionId,
      label: question?.label ?? "Additional detail",
      displayValue: question
        ? formatAdminAnswerDisplayValue(question, value)
        : typeof value === "boolean"
          ? value
            ? "Yes"
            : "No"
          : String(value),
    };
  });
}
