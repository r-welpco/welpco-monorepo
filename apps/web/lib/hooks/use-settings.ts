import { useMutation } from "@tanstack/react-query";
import { changePassword, updateEmail, deleteAccount } from "@/lib/services/user-service";

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePassword(currentPassword, newPassword),
  });
}

export function useUpdateEmail() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => updateEmail(email),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => deleteAccount(),
  });
}
