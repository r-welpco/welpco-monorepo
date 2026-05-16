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
  getPasswordResetEmailHtml,
  getVerificationEmailHtml,
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
        publicAppUrl,
      }),
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

  const bookingType = "booking_created" as const;
  await sendMail(
    {
      to,
      subject: `[smoke] ${getBookingEmailSubject(bookingType)}`,
      html: getBookingEmailHtml({
        type: bookingType,
        variables: {
          customerName: "Jane Customer",
          serviceName: "Housekeeping",
          scheduledDate: "2026-05-20",
          bookingUrl: `${publicAppUrl}/dashboard/bookings`,
        },
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
