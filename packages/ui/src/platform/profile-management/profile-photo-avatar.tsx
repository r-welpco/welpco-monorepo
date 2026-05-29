"use client";

import { Avatar } from "@welpco/ui/avatar";

type ProfilePhotoAvatarSize = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export interface ProfilePhotoAvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  /** `"8"` on profile upload; `"3"` (~32px) for the dashboard greeting. */
  size?: ProfilePhotoAvatarSize;
}

/** Square profile photo (theme rounded corners, not a circle). */
export function ProfilePhotoAvatar({
  src,
  alt,
  fallback,
  size = "8",
}: ProfilePhotoAvatarProps) {
  return (
    <Avatar
      src={src || undefined}
      alt={alt}
      fallback={fallback}
      size={size}
    />
  );
}
