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
import { AdminTimeline } from "@/components/admin-timeline";
import { AdminWarningCallout } from "@/components/admin-callout";
import { DetailRow, DetailTable } from "@/components/detail-rows";
import {
  formatAdminAddress,
  formatAdminDateTime,
  formatAdminMoneyCents,
  formatAdminMoneyMajor,
  formatAdminStatusLabel,
} from "@/lib/admin-format";
import { buildBookingAnswerRows } from "@/lib/booking-answers-utils";
import { buildBookingTimeline, formatScheduleWindow } from "@/lib/booking-detail-utils";
import { listQuestions } from "@/lib/services/admin-questions-service";
import { getAdminBooking } from "@/lib/services/admin-booking-service";
import { BookingActions } from "./booking-actions";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let booking;
  try {
    booking = await getAdminBooking(id);
  } catch {
    notFound();
  }

  const timelineEvents = buildBookingTimeline(booking);
  let answerRows;
  try {
    const questions = await listQuestions();
    answerRows = buildBookingAnswerRows(booking.answers ?? {}, questions);
  } catch {
    answerRows = Object.entries(booking.answers ?? {}).map(([questionId, value]) => ({
      key: questionId,
      label: questionId,
      displayValue: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
    }));
  }
  const receipt = booking.serviceReceipt ?? null;
  const receiptCurrency = receipt?.currency ?? "CAD";

  return (
    <Flex direction="column" gap="4">
      <Text size="2">
        <Link href="/bookings">← Bookings</Link>
      </Text>

      <Flex direction="column" gap="2">
        <Flex gap="2" wrap="wrap" align="center">
          <Heading size="6">Booking</Heading>
          <Badge variant="soft">{formatAdminStatusLabel(booking.status)}</Badge>
          {booking.paymentPhase ? (
            <Badge variant="soft" color="gray">
              Payment: {booking.paymentPhase.replace(/_/g, " ")}
            </Badge>
          ) : null}
        </Flex>
        <Text size="2" color="gray" style={{ fontFamily: "ui-monospace, monospace" }}>
          {booking.id}
        </Text>
        <Flex gap="2" wrap="wrap">
          <Button asChild size="1" variant="soft">
            <Link href={`/users/${booking.customerId}`}>Customer profile</Link>
          </Button>
          <Button asChild size="1" variant="soft">
            <Link href={`/users/${booking.welperId}`}>Welper profile</Link>
          </Button>
          <Button asChild size="1" variant="soft">
            <Link href="/disputes">View disputes</Link>
          </Button>
        </Flex>
      </Flex>

      <Card size="2" title="Timeline">
        <AdminTimeline events={timelineEvents} />
      </Card>

      {booking.paymentAuthorizationFailureMessage ? (
        <AdminWarningCallout
          message={`Payment authorization needs attention: ${booking.paymentAuthorizationFailureMessage}`}
        />
      ) : null}

      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        <Card size="2" title="Schedule & pricing">
          <DetailTable>
            <DetailRow label="Scheduled">{formatScheduleWindow(booking)}</DetailRow>
            <DetailRow label="Duration">
              {booking.durationMinutes != null ? `${booking.durationMinutes} min` : "—"}
            </DetailRow>
            <DetailRow label="Hourly rate">
              {formatAdminMoneyMajor(booking.hourlyRate, receiptCurrency)}
            </DetailRow>
            <DetailRow label="Quoted total">
              {formatAdminMoneyMajor(booking.totalPrice, receiptCurrency)}
            </DetailRow>
            <DetailRow label="Service offering">
              <Link href={`/users/${booking.welperId}`}>
                <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {booking.serviceOfferingId}
                </Text>
              </Link>
            </DetailRow>
          </DetailTable>
        </Card>

        <Card size="2" title="Participants">
          <DetailTable>
            <DetailRow label="Customer">
              <Flex direction="column" gap="1">
                {booking.customerFirstName ? (
                  <Text size="2">{booking.customerFirstName}</Text>
                ) : null}
                <Link href={`/users/${booking.customerId}`}>
                  <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                    {booking.customerId}
                  </Text>
                </Link>
              </Flex>
            </DetailRow>
            <DetailRow label="Welper">
              <Link href={`/users/${booking.welperId}`}>
                <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {booking.welperId}
                </Text>
              </Link>
            </DetailRow>
            <DetailRow label="Created">{formatAdminDateTime(booking.createdAt)}</DetailRow>
            <DetailRow label="Last updated">{formatAdminDateTime(booking.updatedAt)}</DetailRow>
          </DetailTable>
        </Card>
      </Grid>

      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        <Card size="2" title="Location & notes">
          <DetailTable>
            <DetailRow label="Address">
              <Text size="1" style={{ whiteSpace: "pre-wrap" }}>
                {formatAdminAddress(booking.address)}
              </Text>
            </DetailRow>
            <DetailRow label="Booking notes">
              <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                {booking.notes?.trim() || "—"}
              </Text>
            </DetailRow>
          </DetailTable>
        </Card>

        <Card size="2" title="Payment">
          <DetailTable>
            <DetailRow label="Payment phase">
              {booking.paymentPhase ? formatAdminStatusLabel(booking.paymentPhase) : "—"}
            </DetailRow>
            <DetailRow label="Capture eligible at">
              {formatAdminDateTime(booking.captureEligibleAt)}
            </DetailRow>
            <DetailRow label="Authorization">
              {booking.paymentAuthorizationStatus
                ? formatAdminStatusLabel(booking.paymentAuthorizationStatus)
                : "—"}
            </DetailRow>
            <DetailRow label="Authorization due">
              {formatAdminDateTime(booking.paymentAuthorizationDueAt)}
            </DetailRow>
            <DetailRow label="Auto-cancel cutoff">
              {formatAdminDateTime(booking.paymentAuthorizationDeadlineAt)}
            </DetailRow>
            <DetailRow label="Last authorization attempt">
              {formatAdminDateTime(booking.paymentAuthorizationLastAttemptAt)}
            </DetailRow>
            <DetailRow label="Authorization attempts">
              {booking.paymentAuthorizationAttemptCount ?? 0}
            </DetailRow>
            {booking.paymentAuthorizationFailureCode ? (
              <DetailRow label="Payment issue code">
                <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {booking.paymentAuthorizationFailureCode}
                </Text>
              </DetailRow>
            ) : null}
            <DetailRow label="Dispute report deadline">
              {formatAdminDateTime(booking.disputeReportDeadlineAt)}
            </DetailRow>
          </DetailTable>
        </Card>
      </Grid>

      {booking.cancellationReason || booking.declineReason ? (
        <Card size="2" title="Outcome notes">
          <DetailTable>
            {booking.cancellationReason ? (
              <DetailRow label="Cancellation reason">
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {booking.cancellationReason}
                </Text>
              </DetailRow>
            ) : null}
            {booking.declineReason ? (
              <DetailRow label="Decline reason">
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {booking.declineReason}
                </Text>
              </DetailRow>
            ) : null}
          </DetailTable>
        </Card>
      ) : null}

      {receipt ? (
        <Card size="2" title="Service receipt">
          <DetailTable>
            <DetailRow label="Receipt ID">
              <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                {receipt.id}
              </Text>
            </DetailRow>
            <DetailRow label="Billing window">
              {formatAdminDateTime(receipt.billingCheckInAt)} –{" "}
              {formatAdminDateTime(receipt.billingCheckOutAt)}
            </DetailRow>
            <DetailRow label="Hourly rate">
              {formatAdminMoneyMajor(receipt.hourlyRate, receipt.currency)}
            </DetailRow>
            <DetailRow label="Subtotal">
              {formatAdminMoneyCents(receipt.subtotalCents, receipt.currency)}
            </DetailRow>
            <DetailRow label="Tax">
              {formatAdminMoneyCents(receipt.taxCents, receipt.currency)} ({receipt.taxRateBps} bps)
            </DetailRow>
            <DetailRow label="Total charged">
              {formatAdminMoneyCents(receipt.totalCents, receipt.currency)}
            </DetailRow>
            <DetailRow label="Confirmed">{formatAdminDateTime(receipt.confirmedAt)}</DetailRow>
            <DetailRow label="Sent to customer">
              {formatAdminDateTime(receipt.sentToCustomerAt)}
            </DetailRow>
            <DetailRow label="Stripe Tax transaction">
              {receipt.stripeTaxTransactionStatus
                ? formatAdminStatusLabel(receipt.stripeTaxTransactionStatus)
                : "Not recorded"}
            </DetailRow>
            {receipt.stripeTaxTransactionId ? (
              <DetailRow label="Tax transaction ID">
                <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {receipt.stripeTaxTransactionId}
                </Text>
              </DetailRow>
            ) : null}
            {receipt.stripeTaxTransactionError ? (
              <DetailRow label="Tax exception">
                <Text size="2" color="red">
                  {receipt.stripeTaxTransactionError}
                </Text>
              </DetailRow>
            ) : null}
            {receipt.notes ? (
              <DetailRow label="Receipt notes">
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {receipt.notes}
                </Text>
              </DetailRow>
            ) : null}
            {receipt.evidenceFiles && receipt.evidenceFiles.length > 0 ? (
              <DetailRow label="Evidence files">
                <Flex direction="column" gap="1">
                  {receipt.evidenceFiles.map((file, i) => (
                    <Text key={file.id ?? file.key ?? i} size="1">
                      {file.signedUrl ? (
                        <Link href={file.signedUrl} target="_blank" rel="noopener noreferrer">
                          {file.key}
                        </Link>
                      ) : (
                        <Text style={{ fontFamily: "ui-monospace, monospace" }}>{file.key}</Text>
                      )}
                    </Text>
                  ))}
                </Flex>
              </DetailRow>
            ) : null}
          </DetailTable>
        </Card>
      ) : null}

      {answerRows.length > 0 ? (
        <Card size="2" title={`Booking answers (${answerRows.length})`}>
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

      <BookingActions bookingId={booking.id} status={booking.status} />

      <details>
        <summary>
          <Text size="2" weight="medium" style={{ cursor: "pointer" }}>
            Raw JSON
          </Text>
        </summary>
        <Card size="2" style={{ marginTop: "var(--space-3)" }}>
          <pre
            style={{
              margin: 0,
              fontSize: "0.75rem",
              overflow: "auto",
              maxHeight: "50vh",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(booking, null, 2)}
          </pre>
        </Card>
      </details>
    </Flex>
  );
}
