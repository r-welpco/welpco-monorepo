"use client";

import { Avatar as RadixAvatar } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface AvatarProps extends ComponentPropsWithoutRef<typeof RadixAvatar> {}

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ size = "3", ...props }, ref) => {
    return <RadixAvatar ref={ref} size={size} {...props} />;
  }
);

Avatar.displayName = "Avatar";

