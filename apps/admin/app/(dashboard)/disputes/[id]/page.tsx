import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@welpco/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminInfoCallout,
  AdminSuccessCallout,
  AdminWarningCallout,
} from "@/components/admin-callout";
import { AdminTimeline } from "@/components/admin-timeline";
import { DetailRow, DetailTable } from "@/components/detail-rows";
import {
  formatAdminDateTime,
  formatAdminMoneyCents,
  formatAdminStatusLabel,
} from "@/lib/admin-format";
import { buildDisputeTimeline } from "@/lib/dispute-detail-utils";
import {
  getDisputeById,
  type DisputeItem,
  type DisputeParticipantSummary,
} from "@/lib/services/dispute-service";
import { ResolutionForm } from "./resolution-form";

export const dynamic = "force-dynamic";

function participantName(p: DisputeParticipantSummary): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}

function ParticipantCard({
  title,
  participant,
}: {
  title: string;
  participant: DisputeParticipantSummary;
}) {
  return (
    <Card size="2" title={title}>
      <DetailTable>
        <DetailRow label="Name">{participantName(participant)}</DetailRow>
        <DetailRow label="User ID">
          <Link href={`/users/${participant.userId}`}>
            <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
              {participant.userId}
            </Text>
          </Link>
        </DetailRow>
        <DetailRow label="Email">
          {participant.email ? (
            <a href={`mailto:${participant.email}`}>{participant.email}</a>
          ) : (
            <Text size="2" color="gray">
              Not on account
            </Text>
          )}
        </DetailRow>
        <DetailRow label="Phone">{participant.phoneDisplay ?? "—"}</DetailRow>
        <DetailRow label="Role">{participant.role}</DetailRow>
      </DetailTable>
    </Card>
  );
}

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let dispute: DisputeItem;
  try {
    dispute = await getDisputeById(id);
  } catch {
    notFound();
  }

  const canResolve = dispute.status === "open" || dispute.status === "in-review";
  const timelineEvents = buildDisputeTimeline(dispute);
  const evidence = dispute.evidence ?? [];

  return (
    <Flex direction="column" gap="4">
      <Text size="2">
        <Link href="/disputes">← Disputes</Link>
      </Text>

      <Flex direction="column" gap="2">
        <Heading size="6">{dispute.subject}</Heading>
        <Flex gap="2" wrap="wrap" align="center">
          <Badge variant="soft">{dispute.status}</Badge>
          <Badge variant="soft" color="gray">
            {dispute.category}
          </Badge>
          {dispute.bookingStatus ? (
            <Badge variant="soft" color="gray">
              Booking: {formatAdminStatusLabel(dispute.bookingStatus)}
            </Badge>
          ) : null}
        </Flex>
        <Flex gap="2" wrap="wrap">
          <Button asChild size="1" variant="soft">
            <Link href={`/bookings/${dispute.bookingId}`}>Open booking</Link>
          </Button>
          <Button asChild size="1" variant="soft">
            <Link href={`/users/${dispute.filerId}`}>View filer</Link>
          </Button>
        </Flex>
      </Flex>

      {dispute.bookingCancelledWithOpenDispute ? (
        <AdminWarningCallout
          message={
            <>
              <Text weight="bold">Cancelled while disputed.</Text> This booking was cancelled before
              the dispute was closed. Record a resolution to close the dispute.
            </>
          }
        />
      ) : null}

      {dispute.capturedPayment ? (
        <AdminInfoCallout
          message={
            <>
              <Text weight="bold">Captured payments on file:</Text>{" "}
              {formatAdminMoneyCents(
                dispute.capturedPayment.totalCents,
                dispute.capturedPayment.currency,
              )}
              . Partial refunds apply to the latest capture first.
            </>
          }
        />
      ) : null}

      <Card size="2" title="Timeline">
        <AdminTimeline events={timelineEvents} />
      </Card>

      <Card size="2" title="Dispute details">
        <DetailTable>
          <DetailRow label="Dispute ID">
            <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
              {dispute.id}
            </Text>
          </DetailRow>
          <DetailRow label="Booking">
            <Link href={`/bookings/${dispute.bookingId}`}>
              <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                {dispute.bookingId}
              </Text>
            </Link>
          </DetailRow>
          <DetailRow label="Category">{dispute.category}</DetailRow>
          <DetailRow label="Filer">
            {dispute.filerType} ·{" "}
            <Link href={`/users/${dispute.filerId}`}>
              <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                {dispute.filerId}
              </Text>
            </Link>
          </DetailRow>
          <DetailRow label="Filed">{formatAdminDateTime(dispute.createdAt)}</DetailRow>
          <DetailRow label="Last updated">{formatAdminDateTime(dispute.updatedAt)}</DetailRow>
          <DetailRow label="Description">
            <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
              {dispute.description?.trim() || "—"}
            </Text>
          </DetailRow>
        </DetailTable>
      </Card>

      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        {dispute.customer ? (
          <ParticipantCard title="Customer" participant={dispute.customer} />
        ) : null}
        {dispute.welper ? <ParticipantCard title="Welper" participant={dispute.welper} /> : null}
      </Grid>

      {evidence.length > 0 ? (
        <Card size="2" title={`Evidence (${evidence.length})`}>
          <DetailTable>
            {evidence.map((item, index) => (
              <DetailRow key={item.id ?? item.key ?? item.messageId ?? index} label={item.type}>
                {item.type === "file" && item.key ? (
                  item.signedUrl ? (
                    <Link href={item.signedUrl} target="_blank" rel="noopener noreferrer">
                      <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                        {item.key}
                      </Text>
                    </Link>
                  ) : (
                    <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                      {item.key}
                    </Text>
                  )
                ) : item.messageId || item.id ? (
                  <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                    Message {item.messageId ?? item.id}
                  </Text>
                ) : (
                  <Text size="2" color="gray">
                    —
                  </Text>
                )}
              </DetailRow>
            ))}
          </DetailTable>
        </Card>
      ) : null}

      {dispute.resolution ? (
        <Card size="2" title="Resolution on file">
          <DetailTable>
            <DetailRow label="Type">
              {formatAdminStatusLabel(dispute.resolution.resolutionType)}
            </DetailRow>
            <DetailRow label="Resolved at">
              {formatAdminDateTime(dispute.resolution.resolvedAt)}
            </DetailRow>
            {dispute.resolution.resolvedById ? (
              <DetailRow label="Resolved by">
                <Link href={`/users/${dispute.resolution.resolvedById}`}>
                  <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                    {dispute.resolution.resolvedById}
                  </Text>
                </Link>
              </DetailRow>
            ) : null}
            {dispute.resolution.refundAmount != null ? (
              <DetailRow label="Refund amount (recorded)">
                {dispute.resolution.refundAmount}
              </DetailRow>
            ) : null}
            {dispute.resolution.notes ? (
              <DetailRow label="Notes">
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {dispute.resolution.notes}
                </Text>
              </DetailRow>
            ) : null}
          </DetailTable>
        </Card>
      ) : null}

      {canResolve ? (
        <ResolutionForm disputeId={dispute.id} dispute={dispute} />
      ) : (
        <AdminSuccessCallout message="This dispute is already resolved." />
      )}
    </Flex>
  );
}
