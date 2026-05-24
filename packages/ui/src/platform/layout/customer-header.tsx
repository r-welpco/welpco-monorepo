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
  Languages,
} from "lucide-react";
import { useState, useEffect, useCallback, type CSSProperties } from "react";
import type { DashboardLocale } from "./welper-header";

function useResolvedColorScheme(
  themeMode: "light" | "dark" | "system",
): "light" | "dark" {
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const sync = useCallback(() => {
    if (themeMode === "dark") {
      setResolved("dark");
      return;
    }
    if (themeMode === "light") {
      setResolved("light");
      return;
    }
    setResolved(
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
  }, [themeMode]);

  useEffect(() => {
    sync();
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => sync();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themeMode, sync]);

  useEffect(() => {
    const onThemeChange = () => sync();
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, [sync]);

  return resolved;
}

function CustomerBrandMark({
  roleBadge,
  colorScheme,
}: {
  roleBadge?: string;
  colorScheme: "light" | "dark";
}) {
  return (
    <Flex align="center" gap="2">
      <Box display={{ initial: "block", md: "none" }}>
        <Logo type="imagotype" size={32} colorScheme={colorScheme} />
      </Box>
      <Box display={{ initial: "none", md: "block" }}>
        <Logo type="imagotype" size={36} colorScheme={colorScheme} />
      </Box>
      <Badge color="blue" variant="soft" size="1" highContrast>
        {roleBadge ?? "Customer"}
      </Badge>
    </Flex>
  );
}

export interface CustomerHeaderLabels {
  roleBadge?: string;
  tabs: {
    dashboard: string;
    search: string;
    bookings: string;
    messages: string;
    profile: string;
    settings: string;
  };
  userMenu: {
    profile: string;
    accountSettings: string;
    signOut: string;
  };
  themeMenu: string;
  theme: {
    system: string;
    light: string;
    dark: string;
  };
  languageMenu: string;
  language: {
    english: string;
    french: string;
  };
  chrome?: {
    mobileNavMenu?: string;
    feedback?: string;
    documentation?: string;
    openNavAria?: string;
    bellAria?: string;
    bellUnreadAria?: (count: number) => string;
    searchPlaceholder?: string;
    userMenuAria?: string;
  };
}

/** @deprecated Use CustomerHeaderLabels */
export type CustomerHeaderMenuLabels = Pick<
  CustomerHeaderLabels,
  "userMenu" | "themeMenu" | "theme" | "languageMenu" | "language"
>;

export interface CustomerHeaderProps {
  activeTab?: string;
  /**
   * Whether a user is signed in. Defaults to `true` (authenticated app shell).
   * When `false`, the header collapses to a public marketing shell.
   */
  signedIn?: boolean;
  /** Optional `next` query param appended to /login + /register links when signed-out. */
  signedOutReturnTo?: string;
  /** Localized nav and menu copy from the host app (next-intl). */
  labels?: CustomerHeaderLabels;
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
  locale?: DashboardLocale;
  onLocaleChange?: (locale: DashboardLocale) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  /** Host-provided tint for the desktop tab strip (e.g. from Appearance background). */
  tabStripStyle?: CSSProperties;
}

const DEFAULT_CUSTOMER_TABS = [
  { value: "dashboard", label: "Dashboard", href: "/dashboard" },
  { value: "search", label: "Search Welper", href: "/dashboard/search" },
  { value: "bookings", label: "Bookings", href: "/dashboard/bookings" },
  { value: "messages", label: "Messages", href: "/dashboard/messages" },
  { value: "profile", label: "Profile", href: "/dashboard/profile" },
  { value: "settings", label: "Settings", href: "/dashboard/settings" },
] as const;

export function CustomerHeader({
  activeTab = "dashboard",
  signedIn = true,
  signedOutReturnTo,
  labels: labelsProp,
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
  locale: localeProp,
  onLocaleChange,
  onProfileClick,
  onSettingsClick,
  onLogout,
  tabStripStyle,
}: CustomerHeaderProps) {
  const labels = labelsProp;
  const customerTabs = labels
    ? [
        { value: "dashboard" as const, label: labels.tabs.dashboard, href: "/dashboard" },
        { value: "search" as const, label: labels.tabs.search, href: "/dashboard/search" },
        { value: "bookings" as const, label: labels.tabs.bookings, href: "/dashboard/bookings" },
        { value: "messages" as const, label: labels.tabs.messages, href: "/dashboard/messages" },
        { value: "profile" as const, label: labels.tabs.profile, href: "/dashboard/profile" },
        { value: "settings" as const, label: labels.tabs.settings, href: "/dashboard/settings" },
      ]
    : DEFAULT_CUSTOMER_TABS;

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
  const colorScheme = useResolvedColorScheme(appearance);

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
    { value: "system", label: labels?.theme.system ?? "System", Icon: Monitor },
    { value: "light", label: labels?.theme.light ?? "Light", Icon: Sun },
    { value: "dark", label: labels?.theme.dark ?? "Dark", Icon: Moon },
  ];

  const languageOptions: Array<{ value: DashboardLocale; label: string }> = [
    { value: "en", label: labels?.language.english ?? "English" },
    { value: "fr", label: labels?.language.french ?? "French" },
  ];

  const loginHref = signedOutReturnTo
    ? `/login?next=${encodeURIComponent(signedOutReturnTo)}`
    : "/login";
  const registerHref = signedOutReturnTo
    ? `/register?next=${encodeURIComponent(signedOutReturnTo)}`
    : "/register";

  if (!signedIn) {
    return (
      <Box
        asChild
        position="sticky"
        top="0"
        style={{
          zIndex: 50,
          backgroundColor: "var(--color-background)",
          borderBottom: "1px solid var(--gray-4)",
        }}
      >
        <header>
          <Box px={{ initial: "4", sm: "6" }} style={{ width: "100%", minWidth: 0 }}>
            <Flex
              align="center"
              justify="between"
              gap="3"
              height={{ initial: "56px", md: "64px" }}
            >
              <Flex align="center" gap="2" flexShrink="0">
                <Box asChild>
                  <a href="/" aria-label="Welpco home">
                    <Flex align="center" gap="2">
                      <Box display={{ initial: "block", md: "none" }}>
                        <Logo variant="primary" type="isotype" size={28} />
                      </Box>
                      <Box display={{ initial: "none", md: "block" }}>
                        <Logo variant="primary" type="isotype" size={32} />
                      </Box>
                      <Text size="3" weight="bold">
                        Welpco
                      </Text>
                    </Flex>
                  </a>
                </Box>
              </Flex>

              <Flex align="center" gap={{ initial: "2", md: "3" }} flexShrink="0">
                <Button asChild variant="ghost" color="gray" size="2">
                  <a href={loginHref}>Sign in</a>
                </Button>
                <Button asChild size="2">
                  <a href={registerHref}>Sign up</a>
                </Button>
              </Flex>
            </Flex>
          </Box>
        </header>
      </Box>
    );
  }

  return (
    <Box
      asChild
      position="sticky"
      top="0"
      style={{
        zIndex: 50,
        backgroundColor: "var(--color-background)",
        width: "100%",
      }}
    >
      <header style={{ width: "100%" }}>
        <Box px={{ initial: "4", sm: "6" }} style={{ width: "100%", minWidth: 0 }}>
          <Flex
            align="center"
            justify="between"
            gap="3"
            height={{ initial: "56px", md: "60px" }}
          >
            <Flex align="center" gap="2" flexShrink="0">
              <Box display={{ initial: "block", md: "none" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <IconButton
                      variant="ghost"
                      size="3"
                      aria-label={labels?.chrome?.openNavAria ?? "Open navigation menu"}
                    >
                      <Menu size={20} aria-hidden="true" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" style={{ minWidth: "220px" }}>
                    <DropdownMenuLabel>
                      {labels?.chrome?.mobileNavMenu ?? "Navigate"}
                    </DropdownMenuLabel>
                    {customerTabs.map((tab) => (
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

              {onRoleSwitch ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="2" color="gray">
                      <Flex align="center" gap="2">
                        <CustomerBrandMark
                          roleBadge={labels?.roleBadge}
                          colorScheme={colorScheme}
                        />
                        <ChevronDown size={14} aria-hidden="true" />
                      </Flex>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" style={{ minWidth: "180px", maxWidth: "90vw" }}>
                    <DropdownMenuLabel>Switch role</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onRoleSwitch}>
                      <Flex align="center" gap="2" justify="between" style={{ width: "100%" }}>
                        <Text size="2">Welper</Text>
                        <ExternalLink size={14} aria-hidden="true" />
                      </Flex>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <CustomerBrandMark
                  roleBadge={labels?.roleBadge}
                  colorScheme={colorScheme}
                />
              )}
            </Flex>

            <Flex align="center" gap={{ initial: "3", md: "4" }} flexShrink="0">
              {onSearch ? (
                <Box asChild display={{ initial: "none", md: "block" }}>
                  <form onSubmit={handleSearch}>
                    <TextField.Root
                      placeholder={
                        labels?.chrome?.searchPlaceholder ?? "Find services or Welpers…"
                      }
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
                    {labels?.chrome?.feedback ?? "Feedback"}
                  </Button>
                </Box>
              ) : null}

              {notificationSlot ?? (
                <Box position="relative" display="inline-block">
                  <IconButton
                    variant="ghost"
                    size="3"
                    onClick={onNotificationClick}
                    aria-label={
                      notificationCount > 0
                        ? (labels?.chrome?.bellUnreadAria?.(notificationCount) ??
                          `Notifications (${notificationCount} unread)`)
                        : (labels?.chrome?.bellAria ?? "Notifications")
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
                    aria-label={labels?.chrome?.documentation ?? "Documentation"}
                  >
                    <BookOpen size={20} aria-hidden="true" />
                  </IconButton>
                </Box>
              ) : null}

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <IconButton
                      variant="ghost"
                      size="3"
                      aria-label={labels?.chrome?.userMenuAria ?? "User menu"}
                    >
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
                        <Text size="2">{labels?.userMenu.profile ?? "Profile"}</Text>
                      </Flex>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSettingsClick}>
                      <Flex align="center" gap="2">
                        <Settings size={16} aria-hidden="true" />
                        <Text size="2">{labels?.userMenu.accountSettings ?? "Account settings"}</Text>
                      </Flex>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{labels?.themeMenu ?? "Theme"}</DropdownMenuLabel>
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
                    {onLocaleChange ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{labels?.languageMenu ?? "Language"}</DropdownMenuLabel>
                        {languageOptions.map(({ value, label }) => (
                          <DropdownMenuItem
                            key={value}
                            onClick={() => onLocaleChange(value)}
                          >
                            <Flex align="center" gap="2" justify="between" style={{ width: "100%" }}>
                              <Flex align="center" gap="2">
                                <Languages size={16} aria-hidden="true" />
                                <Text size="2">{label}</Text>
                              </Flex>
                              {localeProp === value && (
                                <Check size={14} aria-hidden="true" />
                              )}
                            </Flex>
                          </DropdownMenuItem>
                        ))}
                      </>
                    ) : null}
                    <DropdownMenuSeparator />
                    {onFeedbackClick || onDocsClick ? (
                      <Box display={{ initial: "block", md: "none" }}>
                        {onFeedbackClick ? (
                          <DropdownMenuItem onClick={onFeedbackClick}>
                            <Flex align="center" gap="2">
                              <Text size="2">{labels?.chrome?.feedback ?? "Feedback"}</Text>
                            </Flex>
                          </DropdownMenuItem>
                        ) : null}
                        {onDocsClick ? (
                          <DropdownMenuItem onClick={onDocsClick}>
                            <Flex align="center" gap="2">
                              <BookOpen size={16} aria-hidden="true" />
                              <Text size="2">{labels?.chrome?.documentation ?? "Documentation"}</Text>
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
                        <Text size="2">{labels?.userMenu.signOut ?? "Sign out"}</Text>
                      </Flex>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Flex>
          </Flex>
        </Box>

        <Box
          display={{ initial: "none", md: "block" }}
          overflowX="auto"
          overflowY="hidden"
          style={{
            backgroundColor: "var(--gray-2)",
            ...tabStripStyle,
          }}
        >
          <TabNav
            style={{
              width: "100%",
              borderBottom: "none",
              boxShadow: "none",
            }}
          >
            {customerTabs.map((tab) => (
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
        </Box>
      </header>
    </Box>
  );
}

CustomerHeader.displayName = "CustomerHeader";
