import {
  Badge,
  Button,
  Card,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRow,
  Text,
} from "@welpco/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminTimeline } from "@/components/admin-timeline";
import { DetailRow, DetailTable } from "@/components/detail-rows";
import { formatAdminStatusLabel, shortId } from "@/lib/admin-format";
import { buildBookingAnswerRows } from "@/lib/booking-answers-utils";
import { getAdminJob } from "@/lib/services/admin-job-service";
import { listQuestions } from "@/lib/services/admin-questions-service";

export const dynamic = "force-dynamic";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let job;
  let err: string | null = null;
  try {
    job = await getAdminJob(id);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load job";
  }

  if (err?.includes("404") || err?.toLowerCase().includes("not found")) {
    notFound();
  }

  if (!job && err) {
    return (
      <Flex direction="column" gap="4">
        <AdminPageHeader title="Job detail" />
        <AdminErrorCallout message={err} />
      </Flex>
    );
  }

  if (!job) notFound();

  let answerRows;
  try {
    const questions = await listQuestions();
    answerRows = buildBookingAnswerRows(job.answers ?? {}, questions);
  } catch {
    answerRows = Object.entries(job.answers ?? {}).map(([questionId, value]) => ({
      key: questionId,
      label: questionId,
      displayValue: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
    }));
  }

  const timelineEvents = [
    { id: "published", label: "Published", timestamp: job.publishedAt },
    {
      id: "applications",
      label: `${job.applicationCount} application(s)`,
      timestamp: job.applicationCount > 0 ? job.createdAt : null,
    },
    {
      id: "converted",
      label: "Converted to booking",
      timestamp: job.bookingId ? job.publishedAt : null,
      tone: job.bookingId ? ("success" as const) : undefined,
    },
  ];

  return (
    <Flex direction="column" gap="5">
      <AdminPageHeader
        title={job.title}
        description={`Job ${job.id}`}
        actions={
          <Button asChild variant="soft">
            <Link href="/jobs">Back to jobs</Link>
          </Button>
        }
      />

      <AdminTimeline events={timelineEvents} />

      <Card size="2">
        <Flex direction="column" gap="3">
          <Text weight="bold">Job details</Text>
          <Text size="2">
            Status: <Badge variant="soft">{formatAdminStatusLabel(job.status)}</Badge>
          </Text>
          <Text size="2">
            Customer: <Link href={`/users/${job.customerId}`}>{job.customerId}</Link>
          </Text>
          <Text size="2">
            Category: {job.subcategoryLabel ?? job.categoryLabel ?? `${job.categoryId} / ${job.subcategoryId}`}
          </Text>
          <Text size="2">
            Schedule: {job.scheduledDate} {job.scheduledStartTime}–{job.scheduledEndTime} ({job.durationMinutes} min)
          </Text>
          <Text size="2">Location: {job.locationAddress ?? "—"}</Text>
          <Text size="2">{job.description}</Text>
          {job.bookingId && (
            <Button asChild size="2" variant="soft">
              <Link href={`/bookings/${job.bookingId}`}>View booking {job.bookingId.slice(0, 8)}…</Link>
            </Button>
          )}
        </Flex>
      </Card>

      {answerRows.length > 0 ? (
        <Card size="2" title={`Job answers (${answerRows.length})`}>
          <DetailTable>
            {answerRows.map((row) => (
              <DetailRow key={row.key} label={row.label}>
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {row.displayValue}
                </Text>
              </DetailRow>
            ))}
          </DetailTable>
        </Card>
      ) : null}

      <Card size="2">
        <Text weight="bold" mb="3">
          Applications ({job.applications.length})
        </Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>Welper</TableColumnHeaderCell>
              <TableColumnHeaderCell>Offering</TableColumnHeaderCell>
              <TableColumnHeaderCell>Rate</TableColumnHeaderCell>
              <TableColumnHeaderCell>Status</TableColumnHeaderCell>
              <TableColumnHeaderCell>Proposal</TableColumnHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {job.applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Text color="gray">No applications.</Text>
                </TableCell>
              </TableRow>
            ) : (
              job.applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Flex direction="column" gap="1">
                      <Link href={`/users/${app.welperId}`}>
                        {app.welperDisplayName ?? shortId(app.welperId)}
                      </Link>
                      <Text size="1" color="gray">
                        {shortId(app.welperId)}
                        {app.welperVerified ? " · verified" : ""}
                      </Text>
                    </Flex>
                  </TableCell>
                  <TableCell>{shortId(app.offeringId)}</TableCell>
                  <TableCell>
                    {app.hourlyRateSnapshot != null ? `$${app.hourlyRateSnapshot}/hr` : "—"}
                  </TableCell>
                  <TableCell>{formatAdminStatusLabel(app.status)}</TableCell>
                  <TableCell>
                    <Text size="2" style={{ maxWidth: 320 }}>
                      {app.proposalMessage}
                    </Text>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </Flex>
  );
}
