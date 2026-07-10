# Improvements & Risks

> Last verified: 2026-07-03 · commit de88bd4 · derived from the 2026-07-03 platform documentation audit

This folder tracks things that must change in the **implementation** (not just the docs), plus the plan for retiring the legacy documentation once the new `documentation/` tree is validated.

| File | Contents |
|---|---|
| [implementation-risks.md](implementation-risks.md) | Code, tooling, and process risks found during the audit that need fixing or mitigating — each with evidence and a suggested remediation. |
| [documentation-cleanup.md](documentation-cleanup.md) | Mapping of every legacy doc to its replacement in `documentation/`, with a staged removal plan after validation. |

Conventions:
- Every item cites the file(s) it concerns so it can be actioned without re-investigating.
- When an item is resolved, remove it from the list (git history is the archive) or mark it `✅ done (date)` for one cycle.
