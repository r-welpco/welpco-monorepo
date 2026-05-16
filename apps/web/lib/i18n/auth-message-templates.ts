"use client";

import { useMessages } from "next-intl";
import type en from "@/messages/en.json";

type Messages = typeof en;

/** Raw ICU templates for labels that are interpolated later via `formatLabel`. */
export function useAuthMessages(): Messages {
  return useMessages() as unknown as Messages;
}

export function useAuthRegisterStep<K extends keyof Messages["auth"]["register"]["steps"]>(
  step: K,
): Messages["auth"]["register"]["steps"][K] {
  return useAuthMessages().auth.register.steps[step];
}
