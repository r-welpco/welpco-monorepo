import { escapeHtml, wrapEmail } from "../layout";
import { btnStyle, h1Style, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface BookingEmailVariables {
  customerName?: string;
  welperName?: string;
  serviceName?: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  totalPrice?: string;
  bookingUrl?: string;
  declineReason?: string;
  cancellationReason?: string;
}

export type BookingEmailType =
  | "booking_created"
  | "booking_accepted"
  | "booking_declined"
  | "booking_cancelled"
  | "booking_checked_in"
  | "booking_completed"
  | "booking_service_receipt";

export interface BookingEmailTemplateParams {
  type: BookingEmailType;
  variables: BookingEmailVariables;
  locale?: EmailLocale;
  publicAppUrl?: string;
}

function timeRange(v: BookingEmailVariables): string {
  if (v.startTime && v.endTime) return `${v.startTime} – ${v.endTime}`;
  return "";
}

export function getBookingEmailSubject(type: BookingEmailType): string {
  switch (type) {
    case "booking_created":
      return "New booking request – Welpco";
    case "booking_accepted":
      return "Your booking was accepted – Welpco";
    case "booking_declined":
      return "Booking request declined – Welpco";
    case "booking_cancelled":
      return "Booking cancelled – Welpco";
    case "booking_checked_in":
      return "Welper has checked in – Welpco";
    case "booking_completed":
      return "Service completed – Welpco";
    case "booking_service_receipt":
      return "Service receipt & payment – Welpco";
    default:
      return "Welpco booking update";
  }
}

export function getWelcomeEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "Bienvenue sur Welpco" : "Welcome to Welpco";
}

export function getWelcomeEmailHtml(
  firstName: string | undefined,
  dashboardUrl: string,
  locale: EmailLocale = "en",
  publicAppUrl?: string,
): string {
  const isFr = locale === "fr";
  const safeName = firstName?.trim() ? escapeHtml(firstName.trim()) : null;
  const title = getWelcomeEmailSubject(locale);
  const greeting = isFr
    ? safeName
      ? `Bonjour ${safeName},`
      : "Bonjour,"
    : `Hi ${safeName ?? "there"},`;
  const intro = isFr
    ? "Merci de vous être inscrit. Vous pouvez dès maintenant trouver de l\u2019aide de confiance pour votre famille ou offrir vos services en tant que Welper."
    : "Thanks for signing up. You're all set to find trusted help for your family or to offer your services as a welper.";
  const cta = isFr ? "Accéder au tableau de bord" : "Go to Dashboard";
  const footer = isFr
    ? "Si vous n\u2019avez pas créé de compte, veuillez ignorer ce courriel."
    : "If you didn't create an account, please ignore this email.";
  const heading = isFr ? "Bienvenue sur Welpco\u00a0!" : "Welcome to Welpco!";

  const content = `
<h1 style="${h1Style}">${heading}</h1>
<p style="${pStyle}">${greeting}</p>
<p style="${pStyle}">${intro}</p>
<p style="margin-top: 24px;">
  <a href="${dashboardUrl}" style="${btnStyle}">${cta}</a>
</p>
<p style="margin-top: 1.5em; font-size: 13px; color: #666666;">${footer}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl });
}

export function getBookingEmailHtml(params: BookingEmailTemplateParams): string {
  const locale = params.locale ?? "en";
  const v = params.variables;
  const bookingUrl = v.bookingUrl ?? "#";
  const type = params.type;
  const title = getBookingEmailSubject(type);

  let content: string;

  switch (type) {
    case "booking_created": {
      const serviceName = escapeHtml(v.serviceName || "Service");
      const customerName = escapeHtml(v.customerName || "A customer");
      const date = escapeHtml(v.scheduledDate || "");
      const time = timeRange(v);
      const address = escapeHtml(v.address || "");
      content = `
<h1 style="${h1Style}">New booking request</h1>
<p style="${pStyle}">${customerName} has requested a booking for <strong>${serviceName}</strong>.</p>
${date ? `<p style="${pStyle}"><strong>Date:</strong> ${date}${time ? `, ${time}` : ""}</p>` : ""}
${address ? `<p style="${pStyle}"><strong>Address:</strong> ${address}</p>` : ""}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">View booking</a></p>`;
      break;
    }
    case "booking_accepted": {
      const welperName = escapeHtml(v.welperName || "Your welper");
      const serviceName = escapeHtml(v.serviceName || "your service");
      const date = escapeHtml(v.scheduledDate || "");
      const time = timeRange(v);
      content = `
<h1 style="${h1Style}">Your booking was accepted</h1>
<p style="${pStyle}">${welperName} has accepted your request for <strong>${serviceName}</strong>.</p>
${date ? `<p style="${pStyle}"><strong>When:</strong> ${date}${time ? `, ${time}` : ""}</p>` : ""}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">View booking</a></p>`;
      break;
    }
    case "booking_declined": {
      const serviceName = escapeHtml(v.serviceName || "your request");
      const reason = v.declineReason
        ? `<p style="${pStyle}"><strong>Reason:</strong> ${escapeHtml(v.declineReason)}</p>`
        : "";
      content = `
<h1 style="${h1Style}">Booking request declined</h1>
<p style="${pStyle}">Unfortunately your booking request for <strong>${serviceName}</strong> was declined.</p>
${reason}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">Find another welper</a></p>`;
      break;
    }
    case "booking_cancelled": {
      const serviceName = escapeHtml(v.serviceName || "the booking");
      const reason = v.cancellationReason
        ? `<p style="${pStyle}"><strong>Reason:</strong> ${escapeHtml(v.cancellationReason)}</p>`
        : "";
      content = `
<h1 style="${h1Style}">Booking cancelled</h1>
<p style="${pStyle}">${serviceName} has been cancelled.</p>
${reason}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">View bookings</a></p>`;
      break;
    }
    case "booking_checked_in": {
      const welperName = escapeHtml(v.welperName || "Your welper");
      const serviceName = escapeHtml(v.serviceName || "your service");
      content = `
<h1 style="${h1Style}">Welper has checked in</h1>
<p style="${pStyle}">${welperName} has checked in for <strong>${serviceName}</strong>.</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">View booking</a></p>`;
      break;
    }
    case "booking_completed": {
      const serviceName = escapeHtml(v.serviceName || "your service");
      content = `
<h1 style="${h1Style}">Service completed</h1>
<p style="${pStyle}">Your booking for <strong>${serviceName}</strong> is complete. Thank you for using Welpco!</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">View booking</a></p>`;
      break;
    }
    case "booking_service_receipt": {
      const serviceName = escapeHtml(v.serviceName || "your service");
      const amount = escapeHtml(v.totalPrice || "");
      content = `
<h1 style="${h1Style}">Service receipt</h1>
<p style="${pStyle}">Your welper submitted a receipt for <strong>${serviceName}</strong>.</p>
${amount ? `<p style="${pStyle}"><strong>Amount charged:</strong> $${amount} CAD</p>` : ""}
<p style="${pStyle}">Open your booking to review details. If something looks wrong, you can start a dispute from the booking page.</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">View booking</a></p>`;
      break;
    }
    default:
      content = `<p style="${pStyle}">You have a booking update.</p>`;
  }

  return wrapEmail({
    content,
    locale,
    documentTitle: title,
    publicAppUrl: params.publicAppUrl,
  });
}
