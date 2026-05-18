import { AdminPageHeader } from "@/components/admin-page-header";
import { DashboardLive } from "./dashboard-live";

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader title="Dashboard" />
      <DashboardLive />
    </>
  );
}
