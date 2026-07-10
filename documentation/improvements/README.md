# Improvements & Risks

> Last verified: 2026-07-04 · commit b809feb
> **Folder fully validated 2026-07-04**: every backlog ticket (127) and every historical audit finding was re-verified against the implementation and tagged in place with status + evidence. Trust the per-item tags; original prose predating the validation may contain stale premises (corrections are annotated inline).

This folder tracks things that must change in the **implementation** (not just the docs), plus the plan for retiring the legacy documentation once the new `documentation/` tree is validated.

| File | Contents |
|---|---|
| [implementation-risks.md](implementation-risks.md) | Code, tooling, and process risks found during the audit that need fixing or mitigating — each with evidence and a suggested remediation. |
| [documentation-cleanup.md](documentation-cleanup.md) | Mapping of every legacy doc to its replacement in `documentation/`, with a staged removal plan — **executed 2026-07-04**. |
| [backlog/](backlog/README.md) | The live feature-ticket backlog (formerly `features/` at the repo root): 125 tickets across 9 surfaces, sprint groupings, launch-blocker history. |
| [audits/](audits/) | Historical audit reports: booking-scheduling, search-welpers, Vercel/React best practices, and the 2026-07-03 documentation audit. |

Conventions:
- Every item cites the file(s) it concerns so it can be actioned without re-investigating.
- When an item is resolved, remove it from the list (git history is the archive) or mark it `✅ done (date)` for one cycle.
