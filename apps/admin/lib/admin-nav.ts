/** Header links shown during welper launch phase (other routes remain reachable by URL). */
export const ADMIN_LAUNCH_NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/audit-logs", label: "Audit" },
] as const;
