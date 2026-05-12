"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createQuestion,
  type QuestionType,
} from "@/lib/services/admin-questions-service";

const QUESTION_TYPES: QuestionType[] = [
  "text",
  "number",
  "date",
  "time",
  "choice",
  "boolean",
  "entity_reference",
];

const ENTITY_TYPES = ["child", "person", "pet"] as const;

export default function NewQuestionPage() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [entityType, setEntityType] = useState("");
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const question = await createQuestion({
        type,
        label,
        placeholder: placeholder || null,
        helpText: helpText || null,
        displayOrder,
        entityType: type === "entity_reference" ? (entityType as "child" | "person" | "pet") || null : null,
        options: type === "choice" ? options.filter((o) => o.value && o.label) : null,
      });
      router.push(`/questions/${question.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question");
      setLoading(false);
    }
  }

  return (
    <div>
      <p>
        <Link href="/questions">&larr; All questions</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Create Question</h1>

      <form onSubmit={handleSubmit} className="admin-card">
        <div className="field">
          <label>Label</label>
          <input
            className="admin-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            minLength={1}
            maxLength={255}
            placeholder="e.g. How many rooms need cleaning?"
          />
        </div>

        <div className="field">
          <label>Type</label>
          <select className="admin-input" value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Placeholder (optional)</label>
          <input
            className="admin-input"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            maxLength={255}
          />
        </div>

        <div className="field">
          <label>Help text (optional)</label>
          <textarea
            className="admin-input"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            rows={2}
          />
        </div>

        <div className="field">
          <label>Display order</label>
          <input
            className="admin-input"
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
          />
        </div>

        {type === "entity_reference" && (
          <div className="field">
            <label>Entity type</label>
            <select className="admin-input" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              <option value="">None</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {type === "choice" && (
          <div className="field">
            <label>Options</label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  className="admin-input"
                  placeholder="Value"
                  value={opt.value}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = { ...next[i], value: e.target.value };
                    setOptions(next);
                  }}
                  style={{ flex: 1 }}
                />
                <input
                  className="admin-input"
                  placeholder="Label"
                  value={opt.label}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = { ...next[i], label: e.target.value };
                    setOptions(next);
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn"
              onClick={() => setOptions([...options, { value: "", label: "" }])}
            >
              Add option
            </button>
          </div>
        )}

        {error ? <p className="err">{error}</p> : null}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Creating..." : "Create question"}
        </button>
      </form>
    </div>
  );
}
