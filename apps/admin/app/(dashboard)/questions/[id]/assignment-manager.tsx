"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  listCategories,
  listQuestions,
  assignQuestion,
  removeServiceQuestion,
  updateServiceQuestion,
  type AdminCategory,
  type AdminServiceQuestion,
  type AdminQuestion,
} from "@/lib/services/admin-questions-service";
import { apiClient } from "@/lib/api/client";

async function loadAssignments(questionId: string): Promise<AdminServiceQuestion[]> {
  // Load all categories, then for each that has this question, include it
  const questions = await listQuestions();
  const question = questions.find((q) => q.id === questionId);
  if (!question) return [];

  // Load all categories and their service questions
  const categories = await listCategories();
  const allCategoryIds = flattenCategoryIds(categories);

  const results: AdminServiceQuestion[] = [];
  for (const catId of allCategoryIds) {
    try {
      const sqs = await apiClient.get<AdminServiceQuestion[]>(
        `/api/service-questions/service/${encodeURIComponent(catId)}`
      );
      for (const sq of sqs) {
        if (sq.questionId === questionId) {
          results.push(sq);
        }
      }
    } catch {
      // Category may have no questions
    }
  }
  return results;
}

function flattenCategoryIds(categories: AdminCategory[]): string[] {
  const ids: string[] = [];
  for (const cat of categories) {
    ids.push(cat.id);
    if (cat.children) {
      ids.push(...flattenCategoryIds(cat.children));
    }
  }
  return ids;
}

function flattenCategories(categories: AdminCategory[], prefix = ""): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];
  for (const cat of categories) {
    const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
    result.push({ id: cat.id, label });
    if (cat.children) {
      result.push(...flattenCategories(cat.children, label));
    }
  }
  return result;
}

export function AssignmentManager({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AdminServiceQuestion[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New assignment form
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newDisplayOrder, setNewDisplayOrder] = useState(0);
  const [newIsRequired, setNewIsRequired] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, catData] = await Promise.all([
        loadAssignments(questionId),
        listCategories(),
      ]);
      setAssignments(assignmentData);
      setCategories(flattenCategories(catData));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const assignedCategoryIds = new Set(assignments.map((a) => a.serviceCategoryId));
  const availableCategories = categories.filter((c) => !assignedCategoryIds.has(c.id));

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryId) return;
    setAssigning(true);
    setError(null);
    setSuccess(null);
    try {
      await assignQuestion({
        serviceCategoryId: newCategoryId,
        questionId,
        displayOrder: newDisplayOrder,
        isRequired: newIsRequired,
      });
      setSuccess("Assigned.");
      setNewCategoryId("");
      setNewDisplayOrder(0);
      setNewIsRequired(true);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this assignment?")) return;
    setError(null);
    try {
      await removeServiceQuestion(id);
      setSuccess("Removed.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  async function handleToggleRequired(sq: AdminServiceQuestion) {
    setError(null);
    try {
      await updateServiceQuestion(sq.id, { isRequired: !sq.isRequired });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  if (loading) {
    return <p style={{ color: "var(--admin-muted)" }}>Loading assignments...</p>;
  }

  return (
    <div>
      {error ? <p className="err">{error}</p> : null}
      {success ? <p className="ok">{success}</p> : null}

      {assignments.length === 0 ? (
        <p style={{ color: "var(--admin-muted)" }}>Not assigned to any categories yet.</p>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Order</th>
                <th>Required</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assignments.map((sq) => {
                const catLabel = categories.find((c) => c.id === sq.serviceCategoryId)?.label ?? sq.serviceCategoryId;
                return (
                  <tr key={sq.id}>
                    <td>{catLabel}</td>
                    <td>{sq.displayOrder}</td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: "0.8rem", padding: "2px 8px" }}
                        onClick={() => handleToggleRequired(sq)}
                      >
                        {sq.isRequired ? "Yes" : "No"}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        style={{ color: "var(--admin-danger, #e55)", fontSize: "0.85rem" }}
                        onClick={() => handleRemove(sq.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={handleAssign}
        className="admin-card"
        style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginTop: "1rem" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem", flex: 1, minWidth: 200 }}>
          Assign to category
          <select
            className="admin-input"
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
          >
            <option value="">Select category...</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Order
          <input
            className="admin-input"
            type="number"
            min={0}
            value={newDisplayOrder}
            onChange={(e) => setNewDisplayOrder(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
          <input
            type="checkbox"
            checked={newIsRequired}
            onChange={(e) => setNewIsRequired(e.target.checked)}
          />
          Required
        </label>
        <button type="submit" className="btn btn-primary" disabled={assigning || !newCategoryId}>
          {assigning ? "Assigning..." : "Assign"}
        </button>
      </form>
    </div>
  );
}
