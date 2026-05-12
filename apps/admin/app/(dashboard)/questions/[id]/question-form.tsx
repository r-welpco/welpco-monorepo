"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateQuestion,
  deleteQuestion,
  type AdminQuestion,
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

export function QuestionForm({ question }: { question: AdminQuestion }) {
  const router = useRouter();
  const [label, setLabel] = useState(question.label);
  const [type, setType] = useState<QuestionType>(question.type);
  const [placeholder, setPlaceholder] = useState(question.placeholder ?? "");
  const [helpText, setHelpText] = useState(question.helpText ?? "");
  const [displayOrder, setDisplayOrder] = useState(question.displayOrder);
  const [entityType, setEntityType] = useState(question.entityType ?? "");
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>(
    question.options ?? []
  );
  const [valRequired, setValRequired] = useState(question.validationRules?.required ?? false);
  const [valMin, setValMin] = useState(question.validationRules?.min?.toString() ?? "");
  const [valMax, setValMax] = useState(question.validationRules?.max?.toString() ?? "");
  const [valPattern, setValPattern] = useState(question.validationRules?.pattern ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const validationRules: Record<string, unknown> = {};
      if (valRequired) validationRules.required = true;
      if (valMin !== "") validationRules.min = Number(valMin);
      if (valMax !== "") validationRules.max = Number(valMax);
      if (valPattern) validationRules.pattern = valPattern;

      await updateQuestion(question.id, {
        type,
        label,
        placeholder: placeholder || null,
        helpText: helpText || null,
        displayOrder,
        entityType: type === "entity_reference" ? (entityType as "child" | "person" | "pet") || null : null,
        options: type === "choice" ? options.filter((o) => o.value && o.label) : null,
        validationRules: Object.keys(validationRules).length > 0 ? validationRules as AdminQuestion["validationRules"] : null,
      });
      setSuccess("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this question? This will also remove all category assignments.")) return;
    setDeleting(true);
    try {
      await deleteQuestion(question.id);
      router.push("/questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="admin-card">
      <div className="field">
        <label>Label</label>
        <input
          className="admin-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          minLength={1}
          maxLength={255}
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
        <label>Placeholder</label>
        <input
          className="admin-input"
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          maxLength={255}
        />
      </div>

      <div className="field">
        <label>Help text</label>
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

      <fieldset style={{ border: "1px solid var(--admin-border)", padding: "1rem", borderRadius: 6, marginTop: "1rem" }}>
        <legend style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Validation Rules</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
            <input type="checkbox" checked={valRequired} onChange={(e) => setValRequired(e.target.checked)} />
            Required
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
            Min
            <input className="admin-input" type="number" value={valMin} onChange={(e) => setValMin(e.target.value)} style={{ width: 80 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
            Max
            <input className="admin-input" type="number" value={valMax} onChange={(e) => setValMax(e.target.value)} style={{ width: 80 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
            Pattern (regex)
            <input className="admin-input" value={valPattern} onChange={(e) => setValPattern(e.target.value)} style={{ width: 200 }} />
          </label>
        </div>
      </fieldset>

      {error ? <p className="err">{error}</p> : null}
      {success ? <p className="ok">{success}</p> : null}

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button type="button" className="btn" onClick={handleDelete} disabled={deleting} style={{ color: "var(--admin-danger, #e55)" }}>
          {deleting ? "Deleting..." : "Delete question"}
        </button>
      </div>
    </form>
  );
}
