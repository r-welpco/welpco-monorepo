"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Separator } from "@welpco/ui/separator";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <Box
      style={{
        width: "256px",
        minHeight: "100vh",
        borderRight: "1px solid var(--gray-6)",
        backgroundColor: "var(--color-background)",
        padding: "24px 16px",
      }}
    >
      <Flex direction="column" gap="6">
        <Box>
          <Text size="5" weight="bold" style={{ color: "var(--green-9)" }}>
            Welpco
          </Text>
        </Box>

        <Separator size="4" />

        <Flex direction="column" gap="1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
                <Box
                  p="3"
                  style={{
                    borderRadius: "var(--radius-3)",
                    backgroundColor: isActive
                      ? "var(--green-3)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--gray-3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <Flex align="center" gap="3">
                    <span
                      style={{
                        display: "inline-flex",
                        width: "20px",
                        height: "20px",
                        color: isActive
                          ? "var(--green-11)"
                          : "var(--gray-11)",
                      }}
                    >
                      <Icon />
                    </span>
                    <Text
                      size="3"
                      weight={isActive ? "medium" : "regular"}
                      style={{
                        color: isActive
                          ? "var(--green-11)"
                          : "var(--gray-11)",
                      }}
                    >
                      {item.label}
                    </Text>
                  </Flex>
                </Box>
              </Link>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
}

