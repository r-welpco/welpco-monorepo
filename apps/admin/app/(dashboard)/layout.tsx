import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <strong style={{ marginRight: "auto", letterSpacing: "0.02em" }}>Welpco Admin</strong>
        <Link href="/">Dashboard</Link>
        <Link href="/disputes">Disputes</Link>
        <Link href="/users">Users</Link>
        <Link href="/payments">Payments</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/bookings">Bookings</Link>
        <Link href="/questions">Questions</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/content">Content</Link>
        <Link href="/reviews">Reviews</Link>
        <Link href="/notifications">Notifications</Link>
        <Link href="/referrals">Referrals</Link>
        <Link href="/support-tickets">Support</Link>
        <Link href="/audit-logs">Audit</Link>
        {session?.user?.email ? (
          <span style={{ color: "var(--admin-muted)", fontSize: "0.85rem" }}>{session.user.email}</span>
        ) : null}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="btn" style={{ fontSize: "0.85rem" }}>
            Sign out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
