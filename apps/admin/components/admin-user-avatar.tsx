import { Avatar } from "@welpco/ui/avatar";
import type { ComponentPropsWithoutRef } from "react";

function avatarFallback(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "?";
  return local.charAt(0).toUpperCase();
}

export function AdminUserAvatar({
  email,
  profilePhotoUrl,
  size = "2",
}: {
  email: string;
  profilePhotoUrl?: string | null;
  size?: ComponentPropsWithoutRef<typeof Avatar>["size"];
}) {
  return (
    <Avatar
      src={profilePhotoUrl?.trim() || undefined}
      fallback={avatarFallback(email)}
      size={size}
      radius="full"
      alt=""
    />
  );
}
