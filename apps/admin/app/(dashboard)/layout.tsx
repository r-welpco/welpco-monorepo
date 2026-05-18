import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ADMIN_LAUNCH_NAV } from "@/lib/admin-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <strong style={{ marginRight: "auto", letterSpacing: "0.02em" }}>Welpco Admin</strong>
        {ADMIN_LAUNCH_NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
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
