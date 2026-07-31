"use client";

import { Button, Flex, Separator, Text } from "@welpco/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_LAUNCH_NAV } from "@/lib/admin-nav";
import { AdminTimeZoneLabel } from "@/components/admin-date-time";

function AdminNav() {
  const pathname = usePathname();

  return (
    <Flex align="center" gap="4" wrap="wrap">
      <Text weight="bold" size="3" style={{ marginRight: "auto" }}>
        Welpco Admin
      </Text>
      {ADMIN_LAUNCH_NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
            <Text size="2" weight={active ? "medium" : "regular"} color={active ? undefined : "gray"}>
              {item.label}
            </Text>
          </Link>
        );
      })}
    </Flex>
  );
}

export function AdminShell({
  children,
  sessionEmail,
  signOutAction,
}: {
  children: React.ReactNode;
  sessionEmail?: string | null;
  signOutAction: () => Promise<void>;
}) {
  return (
    <main className="admin-shell">
      <Flex direction="column" gap="4">
        <AdminNav />
        <Flex align="center" gap="3" wrap="wrap">
          <AdminTimeZoneLabel />
          {sessionEmail ? (
            <Text size="1" color="gray">
              {sessionEmail}
            </Text>
          ) : null}
          <form action={signOutAction}>
            <Button type="submit" size="1" variant="soft">
              Sign out
            </Button>
          </form>
        </Flex>
        <Separator size="4" />
        {children}
      </Flex>
    </main>
  );
}
