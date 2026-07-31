import { Badge, Button, Card, Flex, Grid, Heading, Text } from "@welpco/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateTime } from "@/components/admin-date-time";
import { AdminInfoCallout, AdminSuccessCallout, AdminWarningCallout } from "@/components/admin-callout";
import { AdminTimeline } from "@/components/admin-timeline";
import { DetailRow, DetailTable } from "@/components/detail-rows";
import { formatAdminMoneyCents, formatAdminStatusLabel } from "@/lib/admin-format";
import { buildDisputeTimeline } from "@/lib/dispute-detail-utils";
import { getDisputeById, type DisputeItem, type DisputeParticipantSummary } from "@/lib/services/dispute-service";
import { ResolutionForm } from "./resolution-form";
import { RefundReconcileAction } from "./refund-retry-action";

export const dynamic = "force-dynamic";

function participantName(p: DisputeParticipantSummary): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}

function ParticipantCard({ title, participant }: { title: string; participant: DisputeParticipantSummary }) {
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
              <Text weight="bold">Cancelled while disputed.</Text> This booking was cancelled before the dispute was
              closed. Record a resolution to close the dispute.
            </>
          }
        />
      ) : null}

      {dispute.capturedPayment ? (
        <AdminInfoCallout
          message={
            <>
              <Text weight="bold">Captured payments on file:</Text>{" "}
              {formatAdminMoneyCents(dispute.capturedPayment.totalCents, dispute.capturedPayment.currency)}. Partial
              refunds apply to the latest capture first.
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
          <DetailRow label="Filed"><AdminDateTime value={dispute.createdAt} /></DetailRow>
          <DetailRow label="Last updated"><AdminDateTime value={dispute.updatedAt} /></DetailRow>
          <DetailRow label="Description">
            <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
              {dispute.description?.trim() || "—"}
            </Text>
          </DetailRow>
        </DetailTable>
      </Card>

      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        {dispute.customer ? <ParticipantCard title="Customer" participant={dispute.customer} /> : null}
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
          {dispute.resolution.refundException ? (
            <AdminWarningCallout
              message={
                <>
                  <Text weight="bold">Finance exception.</Text> {dispute.resolution.refundException}
                </>
              }
            />
          ) : null}
          <DetailTable>
            <DetailRow label="Type">{formatAdminStatusLabel(dispute.resolution.resolutionType)}</DetailRow>
            <DetailRow label="Resolved at">
              <AdminDateTime value={dispute.resolution.resolvedAt} />
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
              <DetailRow label="Refund amount (recorded)">{dispute.resolution.refundAmount}</DetailRow>
            ) : null}
            {dispute.resolution.refundStatus ? (
              <DetailRow label="Stripe refund">{formatAdminStatusLabel(dispute.resolution.refundStatus)}</DetailRow>
            ) : null}
            {dispute.resolution.workflowStatus ? (
              <DetailRow label="Workflow">{formatAdminStatusLabel(dispute.resolution.workflowStatus)}</DetailRow>
            ) : null}
            {dispute.resolution.refundTargetCents != null ? (
              <DetailRow label="Additional refund target">
                {formatAdminMoneyCents(dispute.resolution.refundTargetCents, "CAD")}
              </DetailRow>
            ) : null}
            {dispute.resolution.refundConfirmedCents != null ? (
              <DetailRow label="Confirmed after decision">
                {formatAdminMoneyCents(dispute.resolution.refundConfirmedCents, "CAD")}
              </DetailRow>
            ) : null}
            {dispute.resolution.refundBaselineCents != null ? (
              <DetailRow label="Already refunded at decision">
                {formatAdminMoneyCents(dispute.resolution.refundBaselineCents, "CAD")}
              </DetailRow>
            ) : null}
            {dispute.resolution.pendingBookingOutcome ? (
              <DetailRow label="Booking outcome after confirmation">
                {formatAdminStatusLabel(dispute.resolution.pendingBookingOutcome)}
              </DetailRow>
            ) : null}
            {dispute.resolution.stripeLastSyncedAt ? (
              <DetailRow label="Last Stripe refresh">
                <AdminDateTime value={dispute.resolution.stripeLastSyncedAt} />
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
          {(dispute.resolution.recommendedRefundAllocation?.length ?? 0) > 0 ? (
            <Flex direction="column" gap="2" mt="3">
              <Text size="2" weight="bold">
                Refund in Stripe Dashboard
              </Text>
              {dispute.resolution.recommendedRefundAllocation?.map((allocation) => (
                <Card key={allocation.chargeId} size="1">
                  <Flex direction="column" gap="1">
                    <Text size="2">
                      Refund {formatAdminMoneyCents(allocation.recommendedRefundCents, "CAD")} on charge{" "}
                      <Text style={{ fontFamily: "ui-monospace, monospace" }}>{allocation.chargeId}</Text>
                    </Text>
                    <Text size="1" color="gray">
                      Captured {formatAdminMoneyCents(allocation.capturedCents, "CAD")}; already refunded{" "}
                      {formatAdminMoneyCents(allocation.refundedCents, "CAD")}
                    </Text>
                    <Link href={allocation.stripeDashboardUrl} target="_blank" rel="noopener noreferrer">
                      Open payment in Stripe
                    </Link>
                  </Flex>
                </Card>
              ))}
            </Flex>
          ) : null}
          {dispute.resolution.refundStatus !== "not_applicable" ? (
            <Flex mt="3">
              <RefundReconcileAction disputeId={dispute.id} />
            </Flex>
          ) : null}
        </Card>
      ) : null}

      {dispute.recoveryTask ? (
        <Card size="2" title="Transfer recovery">
          <AdminWarningCallout
            message={`Reverse exactly ${formatAdminMoneyCents(
              dispute.recoveryTask.outstandingCents,
              "CAD",
            )} on transfer ${dispute.recoveryTask.stripeTransferId} in Stripe. Do not close this dispute manually; Welpco will reconcile the reversal webhook.`}
          />
          <DetailTable>
            <DetailRow label="Required reversal">
              {formatAdminMoneyCents(dispute.recoveryTask.requiredReversalCents, "CAD")}
            </DetailRow>
            <DetailRow label="Recovered">
              {formatAdminMoneyCents(dispute.recoveryTask.recoveredCents, "CAD")}
            </DetailRow>
            <DetailRow label="Status">{formatAdminStatusLabel(dispute.recoveryTask.status)}</DetailRow>
            <DetailRow label="Stripe transfer">
              <Link href={dispute.recoveryTask.stripeDashboardUrl} target="_blank" rel="noopener noreferrer">
                Open transfer in Stripe
              </Link>
            </DetailRow>
          </DetailTable>
        </Card>
      ) : null}

      {canResolve ? (
        <ResolutionForm disputeId={dispute.id} dispute={dispute} />
      ) : dispute.status === "awaiting-refund" || dispute.status === "awaiting-recovery" ? (
        <AdminInfoCallout message="Decision recorded. This dispute stays open until Stripe confirms the required financial actions." />
      ) : (
        <AdminSuccessCallout message="This dispute is already resolved." />
      )}
    </Flex>
  );
}
