import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Backend password requirements: at least 8 characters, one uppercase, one lowercase, one number, one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
  role: z.enum(["customer", "welper"]),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const welperRegisterSchema = z.object({
  accountType: z.enum(["self", "minor"], {
    required_error: "Please select an account type",
  }),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  referralCode: z.string().optional(),
}).refine((data) => {
  if (data.accountType === "minor") {
    return data.guardianName && data.guardianEmail && data.guardianPhone;
  }
  return true;
}, {
  message: "Guardian information is required for minor accounts",
  path: ["guardianName"],
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// Password reset request schema
export const requestPasswordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Password reset confirmation schema
export const confirmPasswordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Change password schema (authenticated)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WelperRegisterInput = z.infer<typeof welperRegisterSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

