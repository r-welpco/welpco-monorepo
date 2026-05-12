/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Wire-shape contract for the unified signup wizard. Shared between BFF and
 * web so the wizard renders against the same names / casings the BFF accepts.
 *
 * The role-conditional required-fields contract is owned by
 * `SignupOrchestratorService`; this file only describes the shape. Every step
 * is named identically on both sides — `selectRole`, `identity`, `welperBio`,
 * etc. — so the wizard URL `/register/step/[step]` and the BFF endpoint
 * `/auth/signup/step/[step]` map 1:1.
 */
export {};
//# sourceMappingURL=signup-state.type.js.map