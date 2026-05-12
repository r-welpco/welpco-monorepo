"use client";

import Link from "next/link";
import { IconButton } from "@welpco/ui/icon-button";
import { Bell } from "lucide-react";
import { Badge } from "@welpco/ui/badge";
import { Box } from "@welpco/ui/box";
import { useUnreadCount } from "@/lib/hooks/use-notifications";

export function NotificationBell() {
  const { data } = useUnreadCount();
  const unreadCount = data?.count ?? 0;

  return (
    <Box style={{ position: "relative", display: "inline-flex" }}>
      <IconButton
        variant="ghost"
        size="2"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        asChild
      >
        <Link href="/dashboard/notifications">
          <Bell size={16} />
        </Link>
      </IconButton>
      {unreadCount > 0 && (
        <Badge
          color="blue"
          variant="solid"
          size="1"
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Box>
  );
}

