"use client";

import { TabNav, TabNavLink } from "@welpco/ui/tab-nav";
import { IconButton } from "@welpco/ui/icon-button";
import { Avatar } from "@welpco/ui/avatar";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Kbd } from "@welpco/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@welpco/ui/dropdown-menu";
import { Badge } from "@welpco/ui/badge";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Flex, Box, Text } from "@welpco/ui";
import { Logo } from "./logo";
import {
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Search,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Check,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";

export interface WelperHeaderProps {
  activeTab?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string | null;
  };
  notificationCount?: number;
  /** When provided, renders this instead of the default bell (use for bell + notification popover from app) */
  notificationSlot?: React.ReactNode;
  onTabChange?: (tab: string) => void;
  onRoleSwitch?: () => void;
  onSearch?: (query: string) => void;
  onFeedbackClick?: () => void;
  onNotificationClick?: () => void;
  onDocsClick?: () => void;
  /** When set (e.g. from app store), theme menu reflects this value and should be updated via onThemeChange */
  themeMode?: "light" | "dark" | "system";
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}

const welperTabs = [
  { value: "dashboard", label: "Dashboard", href: "/dashboard" },
  { value: "messages", label: "Messages", href: "/dashboard/messages" },
  { value: "bookings", label: "Bookings", href: "/dashboard/bookings" },
  { value: "profile", label: "Profile", href: "/dashboard/profile" },
  { value: "settings", label: "Settings", href: "/dashboard/settings" },
] as const;

export function WelperHeader({
  activeTab = "dashboard",
  user,
  notificationCount = 0,
  notificationSlot,
  onTabChange,
  onRoleSwitch,
  onSearch,
  onFeedbackClick,
  onNotificationClick,
  onDocsClick,
  themeMode: themeModeProp,
  onThemeChange,
  onProfileClick,
  onSettingsClick,
  onLogout,
}: WelperHeaderProps) {
  const [uncontrolledTheme, setUncontrolledTheme] = useState<"light" | "dark" | "system">("system");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (themeModeProp !== undefined) return;
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "system") {
      setUncontrolledTheme(saved);
    }
  }, [themeModeProp]);

  const appearance = themeModeProp ?? uncontrolledTheme;

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    if (themeModeProp === undefined) {
      setUncontrolledTheme(theme);
      localStorage.setItem("theme", theme);
      const actualTheme =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      window.dispatchEvent(new CustomEvent("theme-change", { detail: actualTheme }));
    }
    onThemeChange?.(theme);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const themeOptions: Array<{ value: "system" | "light" | "dark"; label: string; Icon: typeof Monitor }> = [
    { value: "system", label: "System", Icon: Monitor },
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
  ];

  return (
    <Box
      asChild
      position="sticky"
      top="0"
      style={{
        zIndex: 50,
        backgroundColor: "var(--color-background)",
        borderBottom: "2px solid var(--green-6)",
      }}
    >
      <header>
        {/* Top bar: 52px mobile, 60px desktop */}
        <Box px={{ initial: "4", sm: "6" }} style={{ width: "100%", minWidth: 0 }}>
          <Flex
            align="center"
            justify="between"
            gap="3"
            height={{ initial: "56px", md: "60px" }}
          >
            {/* Left: Hamburger (mobile) + Logo + role switcher */}
            <Flex align="center" gap="2" flexShrink="0">
              {/* Mobile hamburger — opens the nav menu */}
              <Box display={{ initial: "block", md: "none" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <IconButton
                      variant="ghost"
                      size="3"
                      aria-label="Open navigation menu"
                    >
                      <Menu size={20} aria-hidden="true" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" style={{ minWidth: "220px" }}>
                    <DropdownMenuLabel>Navigate</DropdownMenuLabel>
                    {welperTabs.map((tab) => (
                      <DropdownMenuItem
                        key={tab.value}
                        onClick={(e) => {
                          if (!onTabChange) return;
                          e.preventDefault();
                          onTabChange(tab.value);
                        }}
                      >
                        <Flex align="center" gap="2" justify="between" style={{ width: "100%" }}>
                          <Text
                            size="2"
                            weight={activeTab === tab.value ? "bold" : "regular"}
                          >
                            {tab.label}
                          </Text>
                          {activeTab === tab.value && (
                            <Check size={14} aria-hidden="true" />
                          )}
                        </Flex>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Box>

              <Box display={{ initial: "block", md: "none" }}>
                <Logo variant="primary" type="isotype" size={24} />
              </Box>
              <Box display={{ initial: "none", md: "block" }}>
                <Logo variant="primary" type="isotype" size={28} />
              </Box>
              {onRoleSwitch ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="2" color="gray">
                      <Flex align="center" gap="2">
                        <Text size="3" weight="bold">
                          Welpco
                        </Text>
                        <Box display={{ initial: "none", xs: "block" }}>
                          <Badge color="green" variant="soft" size="1" highContrast>
                            Welper
                          </Badge>
                        </Box>
                        <ChevronDown size={14} aria-hidden="true" />
                      </Flex>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" style={{ minWidth: "180px", maxWidth: "90vw" }}>
                    <DropdownMenuLabel>Switch role</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onRoleSwitch}>
                      <Flex align="center" gap="2" justify="between" style={{ width: "100%" }}>
                        <Text size="2">Customer</Text>
                        <ExternalLink size={14} aria-hidden="true" />
                      </Flex>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Flex align="center" gap="2">
                  <Text size="3" weight="bold">
                    Welpco
                  </Text>
                  <Box display={{ initial: "none", xs: "block" }}>
                    <Badge color="green" variant="soft" size="1" highContrast>
                      Welper
                    </Badge>
                  </Box>
                </Flex>
              )}
            </Flex>

            {/* Right cluster — generous gap keeps hover states from touching */}
            <Flex align="center" gap={{ initial: "3", md: "4" }} flexShrink="0">
              {onSearch ? (
                <Box asChild display={{ initial: "none", md: "block" }}>
                  <form onSubmit={handleSearch}>
                    <TextField.Root
                      placeholder="Search jobs…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="2"
                      style={{ width: "220px", minWidth: "160px" }}
                    >
                      <TextField.Slot>
                        <Search size={15} aria-hidden="true" />
                      </TextField.Slot>
                      <TextField.Slot side="right">
                        <Kbd size="1">⌘F</Kbd>
                      </TextField.Slot>
                    </TextField.Root>
                  </form>
                </Box>
              ) : null}

              {onFeedbackClick ? (
                <Box display={{ initial: "none", md: "block" }}>
                  <Button
                    variant="soft"
                    size="2"
                    color={SEMANTIC_COLOR.primary}
                    highContrast
                    onClick={onFeedbackClick}
                  >
                    Feedback
                  </Button>
                </Box>
              ) : null}

              {/* Icon cluster — one row, consistent gap */}
              {notificationSlot ?? (
                <Box position="relative" display="inline-block">
                  <IconButton
                    variant="ghost"
                    size="3"
                    onClick={onNotificationClick}
                    aria-label={
                      notificationCount > 0
                        ? `Notifications (${notificationCount} unread)`
                        : "Notifications"
                    }
                  >
                    <Bell size={20} aria-hidden="true" />
                  </IconButton>
                  {notificationCount > 0 && (
                    <Box
                      position="absolute"
                      top="1"
                      right="1"
                      style={{ pointerEvents: "none" }}
                    >
                      <Badge color={SEMANTIC_COLOR.danger} variant="solid" size="1" radius="full" highContrast>
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </Badge>
                    </Box>
                  )}
                </Box>
              )}

              {onDocsClick ? (
                <Box display={{ initial: "none", md: "block" }}>
                  <IconButton
                    variant="ghost"
                    size="3"
                    onClick={onDocsClick}
                    aria-label="Documentation"
                  >
                    <BookOpen size={20} aria-hidden="true" />
                  </IconButton>
                </Box>
              ) : null}

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <IconButton variant="ghost" size="3" aria-label="User menu">
                      <Avatar
                        src={user.image || undefined}
                        alt={user.name || "User"}
                        fallback={user.name?.[0] || user.email?.[0] || "U"}
                        size="2"
                      />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" style={{ width: "240px" }}>
                    <Box p="2">
                      <Text size="2" weight="bold" as="div">
                        {user.name || "User"}
                      </Text>
                      {user.email && (
                        <Text size="1" color="gray" highContrast as="div">
                          {user.email}
                        </Text>
                      )}
                    </Box>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onProfileClick}>
                      <Flex align="center" gap="2">
                        <User size={16} aria-hidden="true" />
                        <Text size="2">Profile</Text>
                      </Flex>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSettingsClick}>
                      <Flex align="center" gap="2">
                        <Settings size={16} aria-hidden="true" />
                        <Text size="2">Account settings</Text>
                      </Flex>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Theme</DropdownMenuLabel>
                    {themeOptions.map(({ value, label, Icon }) => (
                      <DropdownMenuItem key={value} onClick={() => handleThemeChange(value)}>
                        <Flex align="center" gap="2" justify="between" style={{ width: "100%" }}>
                          <Flex align="center" gap="2">
                            <Icon size={16} aria-hidden="true" />
                            <Text size="2">{label}</Text>
                          </Flex>
                          {appearance === value && (
                            <Check size={14} aria-hidden="true" />
                          )}
                        </Flex>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    {onFeedbackClick || onDocsClick ? (
                      <Box display={{ initial: "block", md: "none" }}>
                        {onFeedbackClick ? (
                          <DropdownMenuItem onClick={onFeedbackClick}>
                            <Flex align="center" gap="2">
                              <Text size="2">Feedback</Text>
                            </Flex>
                          </DropdownMenuItem>
                        ) : null}
                        {onDocsClick ? (
                          <DropdownMenuItem onClick={onDocsClick}>
                            <Flex align="center" gap="2">
                              <BookOpen size={16} aria-hidden="true" />
                              <Text size="2">Documentation</Text>
                            </Flex>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                      </Box>
                    ) : null}
                    <DropdownMenuItem
                      color={SEMANTIC_COLOR.danger}
                      onSelect={(event) => {
                        event.preventDefault();
                        onLogout?.();
                      }}
                    >
                      <Flex align="center" gap="2">
                        <LogOut size={16} aria-hidden="true" />
                        <Text size="2">Sign out</Text>
                      </Flex>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Flex>
          </Flex>
        </Box>

        {/* Desktop-only tab strip. On mobile the hamburger handles nav. */}
        <Box
          display={{ initial: "none", md: "block" }}
          overflowX="auto"
          overflowY="hidden"
          style={{
            width: "100%",
            backgroundColor: "var(--green-1)",
            borderBottom: "1px solid var(--green-4)",
          }}
        >
          <Flex minHeight="40px" style={{ width: "max-content", minWidth: "100%" }}>
            <TabNav>
              {welperTabs.map((tab) => (
                <TabNavLink
                  key={tab.value}
                  href={tab.href}
                  active={activeTab === tab.value}
                  onClick={(e) => {
                    if (!onTabChange) return;
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    onTabChange(tab.value);
                  }}
                >
                  {tab.label}
                </TabNavLink>
              ))}
            </TabNav>
          </Flex>
        </Box>
      </header>
    </Box>
  );
}

WelperHeader.displayName = "WelperHeader";
