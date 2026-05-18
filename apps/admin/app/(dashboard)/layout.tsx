import { auth, signOut } from "@/auth";
import { AdminShell } from "@/components/admin-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <AdminShell
      sessionEmail={session?.user?.email}
      signOutAction={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      {children}
    </AdminShell>
  );
}
