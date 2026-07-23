"use client";

import { createContext, useContext } from "react";
import type { SelectedRole } from "@welpco/types";

/**
 * Lets the select-role step preview an *uncommitted* role pick in the
 * educational side panel (the panel swaps slide sets instantly on click,
 * before the BFF confirms the choice). Provided by the register layout;
 * the layout clears the preview once `selectedRole` commits.
 */
export interface RegisterEduContextValue {
  setPreviewRole: (role: SelectedRole | null) => void;
}

export const RegisterEduContext =
  createContext<RegisterEduContextValue | null>(null);

/** Null when rendered outside the register layout. */
export function useRegisterEdu(): RegisterEduContextValue | null {
  return useContext(RegisterEduContext);
}
