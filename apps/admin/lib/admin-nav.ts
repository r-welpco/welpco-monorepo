/** Header links shown during welper launch phase (other routes remain reachable by URL). */
export const ADMIN_LAUNCH_NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/bookings", label: "Bookings" },
  { href: "/jobs", label: "Jobs" },
  { href: "/disputes", label: "Disputes" },
  { href: "/audit-logs", label: "Audit" },
] as const;
