"use client";

import { WelperLaunchAnnouncement } from "@/components/features/marketing/welper-launch-announcement/welper-launch-announcement";

/** Client-only welper launch modal + floating reopen control. Not mounted on marketing layout — re-add in `(marketing)/layout.tsx` when needed. */
export function WelperLaunchAnnouncementGate() {
  return <WelperLaunchAnnouncement />;
}
