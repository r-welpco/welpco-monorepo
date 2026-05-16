"use client";

/**
 * Day 15 — Phase 2 Dispatches A + B. Step components for the unified signup
 * wizard. Dispatch A landed `email-password`, `select-role`, `identity`.
 * Dispatch B fills out the welper-only steps + the shared closing steps.
 */
export * from "./types";
export * from "./labels";
export * from "./email-password-step";
export * from "./select-role-step";
export * from "./identity-step";
export * from "./welper-bio-step";
export * from "./welper-service-area-step";
export * from "./welper-offering-step";
export * from "./welper-availability-step";
export * from "./welper-background-check-step";
export * from "./welper-payout-step";
export * from "./notification-prefs-step";
export * from "./optional-profile-step";
