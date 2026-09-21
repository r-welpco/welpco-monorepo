/**
 * Smoke-test branded emails against MailHog (localhost:1025).
 * Run: pnpm --filter @welpco/email smoke:mailhog
 */
import {
  createSmtpTransport,
  getBookingEmailHtml,
  getBookingEmailSubject,
  getContactAckHtml,
  getContactNotificationHtml,
  getJobLifecycleEmailHtml,
  getJobLifecycleEmailSubject,
  getNewMessageEmailHtml,
  getNewMessageEmailSubject,
  getPasswordResetEmailHtml,
  getPaymentEmailHtml,
  getPaymentEmailSubject,
  getPayoutSentEmailHtml,
  getPayoutSentEmailSubject,
  getPortfolioRejectedEmailHtml,
  getPortfolioRejectedEmailSubject,
  getReviewReceivedEmailHtml,
  getReviewReceivedEmailSubject,
  getStripeConnectedEmailHtml,
  getStripeConnectedEmailSubject,
  getVerificationEmailHtml,
  getWelcomeEmailHtml,
  getWelcomeEmailSubject,
  getDisputeEmailHtml,
  getDisputeEmailSubject,
  sendMail,
} from "../src";

const publicAppUrl = process.env.PUBLIC_APP_URL ?? "http://localhost:8081";
const to = process.env.SMOKE_TO ?? "smoke-test@welpco.com";

async function main() {
  const transport = createSmtpTransport({
    host: "localhost",
    port: 1025,
    from: "noreply@welpco.com",
  });

  await sendMail(
    {
      to,
      subject: "[smoke] verification",
      html: getVerificationEmailHtml({
        code: "123456",
        verificationUrl: `${publicAppUrl}/verification?email=test@welpco.com`,
        firstName: "Alex",
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: "[smoke] password reset",
      html: getPasswordResetEmailHtml({
        resetUrl: `${publicAppUrl}/forgot-password?token=abc`,
        firstName: "Alex",
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: `[smoke] ${getWelcomeEmailSubject("en")}`,
      html: getWelcomeEmailHtml(
        "Alex",
        `${publicAppUrl}/dashboard`,
        "en",
        publicAppUrl,
        undefined,
        "customer",
      ),
    },
    transport,
  );

  const contact = {
    role: "Customer",
    name: "Smoke Test",
    email: to,
    phone: "555-0100",
    message: "Hello from smoke test",
  };

  await sendMail(
    {
      to: process.env.CONTACT_INBOX ?? "support@welpco.com",
      subject: "[smoke] contact notification",
      html: getContactNotificationHtml(contact, "en", publicAppUrl),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: "[smoke] contact ack",
      html: getContactAckHtml("Smoke", "en", publicAppUrl),
    },
    transport,
  );

  const bookingVars = {
    customerName: "Jane Customer",
    welperName: "Alex Welper",
    serviceName: "Housekeeping",
    scheduledDate: "2026-05-20",
    startTime: "09:00",
    endTime: "11:00",
    bookingUrl: `${publicAppUrl}/dashboard/bookings`,
    firstName: "Alex",
  };

  for (const type of [
    "booking_created",
    "booking_accepted",
    "booking_accepted_welper",
    "booking_declined",
    "booking_service_receipt",
    "booking_service_submitted",
  ] as const) {
    await sendMail(
      {
        to,
        subject: `[smoke] ${getBookingEmailSubject(type)}`,
        html: getBookingEmailHtml({
          type,
          variables: bookingVars,
          publicAppUrl,
        }),
      },
      transport,
    );
  }

  await sendMail(
    {
      to,
      subject: `[smoke] ${getBookingEmailSubject("booking_cancelled")}`,
      html: getBookingEmailHtml({
        type: "booking_cancelled",
        variables: {
          ...bookingVars,
          cancelledByRole: "customer",
          cancelRecipientRole: "welper",
          cancelWithinFreeWindow: "false",
        },
        publicAppUrl,
      }),
    },
    transport,
  );

  for (const type of [
    "job_published",
    "job_application_received",
    "job_application_sent",
    "job_application_accepted",
    "job_application_not_selected",
  ] as const) {
    await sendMail(
      {
        to,
        subject: `[smoke] ${getJobLifecycleEmailSubject(type)}`,
        html: getJobLifecycleEmailHtml({
          type,
          variables: {
            firstName: "Alex",
            jobTitle: "Lawn care",
            actionUrl: `${publicAppUrl}/dashboard/marketplace`,
          },
          publicAppUrl,
        }),
      },
      transport,
    );
  }

  await sendMail(
    {
      to,
      subject: `[smoke] ${getPaymentEmailSubject("payment_captured_customer")}`,
      html: getPaymentEmailHtml({
        type: "payment_captured_customer",
        variables: {
          firstName: "Alex",
          amount: "50.00",
          currency: "CAD",
          bookingUrl: `${publicAppUrl}/dashboard/bookings`,
        },
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: `[smoke] ${getPaymentEmailSubject("payment_failed")}`,
      html: getPaymentEmailHtml({
        type: "payment_failed",
        variables: {
          firstName: "Alex",
          bookingUrl: `${publicAppUrl}/dashboard/payments`,
        },
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: `[smoke] ${getNewMessageEmailSubject()}`,
      html: getNewMessageEmailHtml({
        firstName: "Alex",
        messagesUrl: `${publicAppUrl}/dashboard/messages`,
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: `[smoke] ${getReviewReceivedEmailSubject()}`,
      html: getReviewReceivedEmailHtml({
        firstName: "Alex",
        reviewUrl: `${publicAppUrl}/dashboard/bookings`,
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: `[smoke] ${getStripeConnectedEmailSubject()}`,
      html: getStripeConnectedEmailHtml({
        firstName: "Alex",
        accountUrl: `${publicAppUrl}/dashboard/payments`,
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: `[smoke] ${getPayoutSentEmailSubject()}`,
      html: getPayoutSentEmailHtml({
        firstName: "Alex",
        accountUrl: `${publicAppUrl}/dashboard/payments`,
        publicAppUrl,
      }),
    },
    transport,
  );

  for (const type of [
    "dispute_filed",
    "dispute_resolved",
    "dispute_withdrawn",
    "refund_decision_recorded",
  ] as const) {
    await sendMail(
      {
        to,
        subject: `[smoke] ${getDisputeEmailSubject(type)}`,
        html: getDisputeEmailHtml({
          type,
          variables: {
            firstName: "Alex",
            subject: "Housekeeping",
            disputeUrl: `${publicAppUrl}/dashboard/disputes`,
            resolutionSummary: "A refund has been issued for your booking.",
          },
          publicAppUrl,
        }),
      },
      transport,
    );
  }

  await sendMail(
    {
      to,
      subject: `[smoke] ${getPaymentEmailSubject("payment_refund")}`,
      html: getPaymentEmailHtml({
        type: "payment_refund",
        variables: {
          firstName: "Alex",
          amount: "50.00",
          currency: "CAD",
          bookingUrl: `${publicAppUrl}/dashboard/bookings`,
        },
        publicAppUrl,
      }),
    },
    transport,
  );

  await sendMail(
    {
      to,
      subject: `[smoke] ${getPaymentEmailSubject("payment_captured_welper")}`,
      html: getPaymentEmailHtml({
        type: "payment_captured_welper",
        variables: {
          firstName: "Alex",
          amount: "40.00",
          currency: "CAD",
          bookingUrl: `${publicAppUrl}/dashboard/bookings`,
        },
        publicAppUrl,
      }),
    },
    transport,
  );

  for (const type of ["booking_checked_in", "booking_payment_released", "booking_completed"] as const) {
    await sendMail(
      {
        to,
        subject: `[smoke] ${getBookingEmailSubject(type)}`,
        html: getBookingEmailHtml({
          type,
          variables: bookingVars,
          publicAppUrl,
        }),
      },
      transport,
    );
  }

  await sendMail(
    {
      to,
      subject: `[smoke] ${getPortfolioRejectedEmailSubject()}`,
      html: getPortfolioRejectedEmailHtml({
        firstName: "Alex",
        profileUrl: `${publicAppUrl}/dashboard/profile`,
        rejectionReason: "Image too blurry",
        publicAppUrl,
      }),
    },
    transport,
  );

  console.log(`Smoke emails sent to MailHog. Check http://localhost:8025 (recipient: ${to})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
