"use client";

import Link from "next/link";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Container } from "@welpco/ui/container";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@welpco/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@welpco/ui/dropdown-menu";
import { LogOut, User, Settings, HandHeart, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { useState } from "react";

// Hoist static navigation items outside component to prevent recreation on every render
const NAVIGATION_ITEMS = ["Services", "About", "FAQ", "Contact"] as const;

const getNavigationHref = (item: string): string => {
  if (item === "Services") return "/#services";
  if (item === "About") return "/#about";
  return `/${item.toLowerCase()}`;
};

export function Header() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Box
      as="div"
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--green-3)",
        borderBottom: "2px solid var(--green-6)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      <Container size="4" style={{ padding: "0 24px" }}>
        <Flex
          align="center"
          justify="between"
          style={{ height: "72px" }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }} aria-label="Welpco - Go to homepage">
            <Flex
              align="center"
              gap="3"
              style={{
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Box
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, var(--green-9) 0%, var(--green-10) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(77, 124, 15, 0.3)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 100%)",
                  }}
                />
                <HandHeart
                  style={{
                    width: "24px",
                    height: "24px",
                    fill: "white",
                    color: "white",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              </Box>
              <Flex direction="column" gap="1">
                <Text
                  as="span"
                  size="6"
                  weight="bold"
                  style={{
                    color: "var(--green-11)",
                    letterSpacing: "-1px",
                    lineHeight: "1",
                  }}
                >
                  Welpco
                </Text>
                <Text
                  as="span"
                  size="1"
                  style={{
                    color: "var(--green-10)",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Community Helpers
                </Text>
              </Flex>
            </Flex>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation">
            <Flex
              align="center"
              gap="2"
              display={{ initial: "none", md: "flex" }}
              as="div"
              role="list"
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {NAVIGATION_ITEMS.map((item) => (
                <div key={item} role="listitem" style={{ margin: 0, padding: 0 }}>
                  <Link
                    href={getNavigationHref(item)}
                    style={{ textDecoration: "none" }}
                    aria-label={`Navigate to ${item} page`}
                  >
                    <Text
                      as="span"
                      size="3"
                      weight="medium"
                      style={{
                        color: "var(--green-11)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        padding: "10px 20px",
                        borderRadius: "10px",
                        display: "block",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--green-12)";
                        e.currentTarget.style.backgroundColor = "var(--green-4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--green-11)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {item}
                    </Text>
                  </Link>
                </div>
              ))}
            </Flex>
          </nav>

          {/* User Actions */}
          <Flex align="center" gap="3" role="group" aria-label="User account actions">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button
                    type="button"
                    aria-label="User menu"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--spacing-2)",
                      padding: "var(--spacing-2)",
                      border: "none",
                      borderRadius: "var(--radius-2)",
                      background: "var(--green-4)",
                      color: "var(--green-11)",
                      cursor: "pointer",
                    }}
                  >
                    <Avatar
                      src={user.image || undefined}
                      alt={user.name || "User"}
                      fallback={user.name || "U"}
                    />
                    <Text size="2" as="span">{user.name || user.email}</Text>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ width: "224px" }}>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" aria-label="Go to dashboard">
                      <Flex align="center" gap="2">
                        <User style={{ width: "16px", height: "16px" }} aria-hidden="true" />
                        Dashboard
                      </Flex>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" aria-label="Go to settings">
                      <Flex align="center" gap="2">
                        <Settings style={{ width: "16px", height: "16px" }} aria-hidden="true" />
                        Settings
                      </Flex>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    style={{ color: "var(--red-9)", cursor: "pointer" }}
                    onClick={() => {
                      void performClientSignOut({ callbackUrl: "/", queryClient });
                    }}
                    aria-label="Log out"
                  >
                    <Flex align="center" gap="2">
                      <LogOut style={{ width: "16px", height: "16px" }} aria-hidden="true" />
                      Log out
                    </Flex>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/dashboard" aria-label="Sign in to your account">
                  <Button
                    variant="ghost"
                    size="2"
                    style={{
                      color: "var(--green-11)",
                      backgroundColor: "var(--green-4)",
                    }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" aria-label="Create a new account">
                  <Button
                    size="2"
                    color="green"
                    style={{
                      fontWeight: 600,
                      backgroundColor: "var(--green-9)",
                      color: "white",
                    }}
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              style={{
                display: "flex",
                color: "var(--green-11)",
                backgroundColor: "var(--green-4)",
              }}
            >
              {mobileMenuOpen ? (
                <X style={{ width: "20px", height: "20px" }} />
              ) : (
                <Menu style={{ width: "20px", height: "20px" }} />
              )}
            </Button>
          </Flex>
        </Flex>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <Box
            display={{ initial: "block", md: "none" }}
            style={{
              padding: "16px 0",
              borderTop: "1px solid var(--green-6)",
            }}
          >
            <Flex direction="column" gap="2">
              {NAVIGATION_ITEMS.map((item) => (
                <Link
                  key={item}
                  href={getNavigationHref(item)}
                  style={{ textDecoration: "none" }}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={`Navigate to ${item} page`}
                >
                  <Text
                    as="span"
                    size="3"
                    weight="medium"
                    style={{
                      color: "var(--green-11)",
                      display: "block",
                      padding: "12px 20px",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--green-4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {item}
                  </Text>
                </Link>
              ))}
            </Flex>
          </Box>
        )}
      </Container>
    </Box>
  );
}

