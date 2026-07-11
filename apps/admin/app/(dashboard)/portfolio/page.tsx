import {
  Badge,
  Button,
  Card,
  Flex,
  SEMANTIC_COLOR,
  TabNav,
  TabNavLink,
  Table,
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRow,
  Text,
} from "@welpco/ui";
import Link from "next/link";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { formatAdminDateTime } from "@/lib/admin-format";
import {
  listAdminPortfolioPhotos,
  type AdminPortfolioPhotosResponse,
  type AdminPortfolioPhotoStatus,
} from "@/lib/services/admin-portfolio-service";
import { PortfolioPhotoActions, PortfolioPhotoThumbnail } from "./portfolio-photo-cells";

export const dynamic = "force-dynamic";

const LIMIT = 25;

type StatusFilter = AdminPortfolioPhotoStatus | "all";

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const STATUS_BADGE_COLOR = {
  pending: SEMANTIC_COLOR.warning,
  approved: SEMANTIC_COLOR.primary,
  rejected: SEMANTIC_COLOR.danger,
} as const satisfies Record<AdminPortfolioPhotoStatus, string>;

const EMPTY_MESSAGE: Record<StatusFilter, string> = {
  pending: "No photos waiting for review.",
  approved: "No approved photos.",
  rejected: "No rejected photos.",
  all: "No portfolio photos yet.",
};

function parseStatus(raw?: string): StatusFilter {
  return raw === "approved" || raw === "rejected" || raw === "all" ? raw : "pending";
}

export default async function PortfolioModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const status = parseStatus(sp.status);

  let list: AdminPortfolioPhotosResponse;
  let err: string | null = null;
  try {
    list = await listAdminPortfolioPhotos({ page, limit: LIMIT, status });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load portfolio photos";
    list = { items: [], total: 0, page: 1, limit: LIMIT };
  }
  const totalPages = Math.max(1, Math.ceil(list.total / list.limit));

  const buildHref = (p: number, st: StatusFilter) => {
    const q = new URLSearchParams();
    if (st !== "pending") q.set("status", st);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/portfolio?${qs}` : "/portfolio";
  };

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Portfolio photos"
        description="Moderate welper portfolio photos before they appear on public profiles. Rejecting a photo notifies the welper; every decision is audit-logged."
      />

      <TabNav size="2">
        {STATUS_TABS.map((tab) => (
          <TabNavLink key={tab.value} asChild active={tab.value === status}>
            <Link href={buildHref(1, tab.value)}>{tab.label}</Link>
          </TabNavLink>
        ))}
      </TabNav>

      <Text size="2" color="gray">
        {list.total} photo{list.total === 1 ? "" : "s"} · page {list.page} of {totalPages}
      </Text>
      {err ? (
        <AdminErrorCallout
          message={`${err} — check that the BFF is reachable, then reload the page.`}
        />
      ) : null}

      <Card size="2" style={{ overflow: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>Photo</TableColumnHeaderCell>
              <TableColumnHeaderCell>Welper</TableColumnHeaderCell>
              <TableColumnHeaderCell>Caption</TableColumnHeaderCell>
              <TableColumnHeaderCell>Status</TableColumnHeaderCell>
              <TableColumnHeaderCell>Submitted</TableColumnHeaderCell>
              <TableColumnHeaderCell>Actions</TableColumnHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Text color="gray">{err ? "Nothing to show." : EMPTY_MESSAGE[status]}</Text>
                </TableCell>
              </TableRow>
            ) : (
              list.items.map((photo) => (
                <TableRow key={photo.id}>
                  <TableCell>
                    <PortfolioPhotoThumbnail photo={photo} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/users/${photo.welperId}`}>
                      <Text size="2">{photo.welperName}</Text>
                    </Link>
                  </TableCell>
                  <TableCell style={{ maxWidth: 280 }}>
                    <Text size="2">{photo.caption?.trim() || "—"}</Text>
                  </TableCell>
                  <TableCell>
                    <Badge variant="soft" color={STATUS_BADGE_COLOR[photo.status]}>
                      {photo.status}
                    </Badge>
                    {photo.status === "rejected" && photo.rejectionReason ? (
                      <Text size="1" color="gray" as="div" mt="1">
                        {photo.rejectionReason}
                      </Text>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Text size="1" color="gray">
                      {formatAdminDateTime(photo.createdAt)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <PortfolioPhotoActions photo={photo} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Flex gap="3">
        {list.page > 1 ? (
          <Button asChild variant="soft" size="2">
            <Link href={buildHref(list.page - 1, status)}>Previous</Link>
          </Button>
        ) : null}
        {list.page < totalPages ? (
          <Button asChild variant="soft" size="2">
            <Link href={buildHref(list.page + 1, status)}>Next</Link>
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
}
