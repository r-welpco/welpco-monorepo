"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Tabs, TabsList, TabsTrigger } from "@welpco/ui/tabs";
import { IconButton } from "@welpco/ui/icon-button";
import { Avatar } from "@welpco/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@welpco/ui/dropdown-menu";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { useQueryClient } from "@tanstack/react-query";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { useAuthStore } from "@/stores/authStore";
import { User, Settings, LogOut } from "lucide-react";

const tabs = [
  { value: "dashboard", label: "Dashboard", href: "/dashboard" },
  { value: "bookings", label: "Bookings", href: "/dashboard/bookings" },
  { value: "messages", label: "Messages", href: "/dashboard/messages" },
  { value: "profile", label: "Profile", href: "/dashboard/profile" },
  { value: "settings", label: "Settings", href: "/dashboard/settings" },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Determine active tab from pathname
  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href))?.value || "dashboard";

  return (
    <Box
      style={{
        borderBottom: "1px solid var(--gray-6)",
        backgroundColor: "var(--color-background)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Flex
        align="center"
        justify="between"
        style={{
          padding: "12px 24px",
          maxWidth: "100%",
        }}
      >
        {/* Tab Navigation */}
        <Tabs value={activeTab} style={{ flex: 1 }}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                onClick={() => router.push(tab.href)}
                style={{ cursor: "pointer" }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Right side: Notifications, Theme Toggle, Profile */}
        <Flex align="center" gap="3">
          <NotificationBell />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--radius-2)",
                  cursor: "pointer",
                  padding: "var(--spacing-1)",
                }}
              >
                <Avatar
                  src={user?.image || undefined}
                  alt={user?.name || "User"}
                  fallback={user?.name?.[0] || user?.email?.[0] || "U"}
                  size="2"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ width: "200px" }}>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" style={{ textDecoration: "none" }}>
                  <Flex align="center" gap="2">
                    <User style={{ width: "16px", height: "16px" }} />
                    <Text size="2">Profile</Text>
                  </Flex>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" style={{ textDecoration: "none" }}>
                  <Flex align="center" gap="2">
                    <Settings style={{ width: "16px", height: "16px" }} />
                    <Text size="2">Settings</Text>
                  </Flex>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                style={{ color: "var(--red-9)", cursor: "pointer" }}
                onSelect={(event) => {
                  event.preventDefault();
                  void performClientSignOut({ callbackUrl: "/", queryClient });
                }}
              >
                <Flex align="center" gap="2">
                  <LogOut style={{ width: "16px", height: "16px" }} />
                  <Text size="2">Logout</Text>
                </Flex>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>
    </Box>
  );
}

