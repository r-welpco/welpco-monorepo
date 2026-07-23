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
  | "booking_request_sent"
  | "booking_accepted"
  | "booking_declined"
  | "booking_cancelled"
  | "booking_checked_in"
  | "booking_completed"
  | "booking_service_receipt"
  | "booking_service_submitted"
  | "booking_payment_released";

export interface BookingEmailTemplateParams {
  type: BookingEmailType;
  variables: BookingEmailVariables;
  locale?: EmailLocale;
  publicAppUrl?: string;
}

export type BookingNotificationCopy = {
  title: string;
  body: string;
};

function isFr(locale?: EmailLocale): boolean {
  return locale === "fr";
}

function timeRange(v: BookingEmailVariables): string {
  if (v.startTime && v.endTime) return `${v.startTime} – ${v.endTime}`;
  return "";
}

export function getBookingEmailSubject(type: BookingEmailType, locale: EmailLocale = "en"): string {
  const fr = isFr(locale);
  switch (type) {
    case "booking_created":
      return fr ? "Nouvelle demande de réservation – Welpco" : "New booking request – Welpco";
    case "booking_request_sent":
      return fr ? "Demande de réservation envoyée – Welpco" : "Booking request sent – Welpco";
    case "booking_accepted":
      return fr ? "Votre réservation a été acceptée – Welpco" : "Your booking was accepted – Welpco";
    case "booking_declined":
      return fr ? "Demande de réservation refusée – Welpco" : "Booking request declined – Welpco";
    case "booking_cancelled":
      return fr ? "Réservation annulée – Welpco" : "Booking cancelled – Welpco";
    case "booking_checked_in":
      return fr ? "Le Welper s\u2019est enregistré – Welpco" : "Welper has checked in – Welpco";
    case "booking_completed":
      return fr ? "Service terminé – Welpco" : "Service completed – Welpco";
    case "booking_service_receipt":
      return fr ? "Reçu de service et paiement – Welpco" : "Service receipt & payment – Welpco";
    case "booking_service_submitted":
      return fr ? "Reçu de service soumis – Welpco" : "Service receipt submitted – Welpco";
    case "booking_payment_released":
      return fr ? "Réservation finalisée – Welpco" : "Booking finalized – Welpco";
    default:
      return fr ? "Mise à jour de réservation Welpco" : "Welpco booking update";
  }
}

/** Short in-app notification copy (same strings as email intros). */
export function getBookingNotificationCopy(
  type: BookingEmailType,
  locale: EmailLocale = "en",
  variables: BookingEmailVariables = {},
): BookingNotificationCopy {
  const fr = isFr(locale);
  const serviceName = variables.serviceName || (fr ? "Service" : "Service");
  const welperName = variables.welperName || (fr ? "Votre Welper" : "Your welper");
  const customerName = variables.customerName || (fr ? "Un client" : "A customer");
  const amount = variables.totalPrice ? `$${variables.totalPrice} CAD` : "";

  switch (type) {
    case "booking_created":
      return {
        title: fr ? "Nouvelle demande de réservation" : "New booking request",
        body: fr
          ? `${customerName} a demandé une réservation pour ${serviceName}.`
          : `${customerName} has requested a booking for ${serviceName}.`,
      };
    case "booking_request_sent":
      return {
        title: fr ? "Demande de réservation envoyée" : "Booking request sent",
        body: fr
          ? `Demande de réservation envoyée à ${welperName} — vous serez avisé de sa réponse. Aucun frais avant la fin du service.`
          : `Booking request sent to ${welperName} — you'll be notified when they respond. No charge until after the job is done.`,
      };
    case "booking_accepted":
      return {
        title: fr ? "Réservation acceptée" : "Booking accepted",
        body: fr
          ? `${welperName} a accepté votre demande pour ${serviceName}.`
          : `${welperName} has accepted your request for ${serviceName}.`,
      };
    case "booking_declined":
      return {
        title: fr ? "Réservation refusée" : "Booking declined",
        body: fr
          ? `Votre demande pour ${serviceName} a été refusée.`
          : `Your booking request for ${serviceName} was declined.`,
      };
    case "booking_cancelled":
      return {
        title: fr ? "Réservation annulée" : "Booking cancelled",
        body: fr
          ? `La réservation pour ${serviceName} a été annulée.`
          : `The booking for ${serviceName} was cancelled.`,
      };
    case "booking_checked_in":
      return {
        title: fr ? "Welper enregistré" : "Welper checked in",
        body: fr
          ? `${welperName} s\u2019est enregistré pour ${serviceName}.`
          : `${welperName} has checked in for ${serviceName}.`,
      };
    case "booking_completed":
      return {
        title: fr ? "Service terminé" : "Service completed",
        body: fr
          ? `Votre réservation pour ${serviceName} est terminée. Merci d\u2019utiliser Welpco\u00a0!`
          : `Your booking for ${serviceName} is complete. Thank you for using Welpco!`,
      };
    case "booking_service_receipt":
      return {
        title: fr ? "Reçu de service" : "Service receipt",
        body: amount
          ? fr
            ? `Votre Welper a soumis un reçu pour ${serviceName}. Montant\u00a0: ${amount}.`
            : `Your welper submitted a receipt for ${serviceName}. Amount: ${amount}.`
          : fr
            ? `Votre Welper a soumis un reçu pour ${serviceName}.`
            : `Your welper submitted a receipt for ${serviceName}.`,
      };
    case "booking_service_submitted":
      return {
        title: fr ? "Reçu soumis" : "Receipt submitted",
        body: fr
          ? `Vous avez soumis un reçu pour ${serviceName}. Le client en sera avisé.`
          : `You submitted a receipt for ${serviceName}. The customer will be notified.`,
      };
    case "booking_payment_released":
      return {
        title: fr ? "Réservation finalisée" : "Booking finalized",
        body: fr
          ? `Le paiement pour ${serviceName} est finalisé. La réservation est maintenant close.`
          : `Payment for ${serviceName} is complete. This booking is now closed.`,
      };
    default:
      return {
        title: fr ? "Mise à jour de réservation" : "Booking update",
        body: fr ? "Vous avez une mise à jour de réservation." : "You have a booking update.",
      };
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
  guideUrl?: string,
): string {
  const isFrLocale = locale === "fr";
  const safeName = firstName?.trim() ? escapeHtml(firstName.trim()) : null;
  const title = getWelcomeEmailSubject(locale);
  const greeting = isFrLocale
    ? safeName
      ? `Bonjour ${safeName},`
      : "Bonjour,"
    : `Hi ${safeName ?? "there"},`;
  const intro = isFrLocale
    ? "Merci de vous être inscrit. Vous pouvez dès maintenant trouver de l\u2019aide de confiance pour votre famille ou offrir vos services en tant que Welper."
    : "Thanks for signing up. You're all set to find trusted help for your family or to offer your services as a welper.";
  const cta = isFrLocale ? "Accéder au tableau de bord" : "Go to Dashboard";
  const footer = isFrLocale
    ? "Si vous n\u2019avez pas créé de compte, veuillez ignorer ce courriel."
    : "If you didn't create an account, please ignore this email.";
  const heading = isFrLocale ? "Bienvenue sur Welpco\u00a0!" : "Welcome to Welpco!";
  const guideLabel = isFrLocale
    ? "Consultez le guide de d\u00e9marrage"
    : "Read the getting-started guide";
  const guideLink = guideUrl
    ? `
<p style="margin-top: 12px; font-size: 14px;">
  <a href="${guideUrl}" style="color: #00492F; text-decoration: underline;">${guideLabel}</a>
</p>`
    : "";

  const content = `
<h1 style="${h1Style}">${heading}</h1>
<p style="${pStyle}">${greeting}</p>
<p style="${pStyle}">${intro}</p>
<p style="margin-top: 24px;">
  <a href="${dashboardUrl}" style="${btnStyle}">${cta}</a>
</p>${guideLink}
<p style="margin-top: 1.5em; font-size: 13px; color: #666666;">${footer}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl });
}

export function getBookingEmailHtml(params: BookingEmailTemplateParams): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const v = params.variables;
  const bookingUrl = v.bookingUrl ?? "#";
  const type = params.type;
  const title = getBookingEmailSubject(type, locale);
  const viewBooking = fr ? "Voir la réservation" : "View booking";
  const viewBookings = fr ? "Voir les réservations" : "View bookings";
  const findWelper = fr ? "Trouver un autre Welper" : "Find another welper";

  let content: string;

  switch (type) {
    case "booking_created": {
      const serviceName = escapeHtml(v.serviceName || "Service");
      const customerName = escapeHtml(v.customerName || (fr ? "Un client" : "A customer"));
      const date = escapeHtml(v.scheduledDate || "");
      const time = timeRange(v);
      const address = escapeHtml(v.address || "");
      const heading = fr ? "Nouvelle demande de réservation" : "New booking request";
      const intro = fr
        ? `${customerName} a demandé une réservation pour <strong>${serviceName}</strong>.`
        : `${customerName} has requested a booking for <strong>${serviceName}</strong>.`;
      content = `
<h1 style="${h1Style}">${heading}</h1>
<p style="${pStyle}">${intro}</p>
${date ? `<p style="${pStyle}"><strong>${fr ? "Date" : "Date"}:</strong> ${date}${time ? `, ${time}` : ""}</p>` : ""}
${address ? `<p style="${pStyle}"><strong>${fr ? "Adresse" : "Address"}:</strong> ${address}</p>` : ""}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    case "booking_request_sent": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      const welperName = escapeHtml(v.welperName || (fr ? "votre Welper" : "your welper"));
      const date = escapeHtml(v.scheduledDate || "");
      const time = timeRange(v);
      const heading = fr ? "Demande de réservation envoyée" : "Booking request sent";
      const intro = fr
        ? `Votre demande de réservation pour <strong>${serviceName}</strong> a été envoyée à ${welperName}. Vous serez avisé dès sa réponse.`
        : `Your booking request for <strong>${serviceName}</strong> was sent to ${welperName}. You'll be notified when they respond.`;
      const reassurance = fr
        ? "Aucun frais avant la fin du service."
        : "No charge until after the job is done.";
      content = `
<h1 style="${h1Style}">${heading}</h1>
<p style="${pStyle}">${intro}</p>
${date ? `<p style="${pStyle}"><strong>${fr ? "Quand" : "When"}:</strong> ${date}${time ? `, ${time}` : ""}</p>` : ""}
<p style="${pStyle}">${reassurance}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    case "booking_accepted": {
      const welperName = escapeHtml(v.welperName || (fr ? "Votre Welper" : "Your welper"));
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      const date = escapeHtml(v.scheduledDate || "");
      const time = timeRange(v);
      content = `
<h1 style="${h1Style}">${fr ? "Votre réservation a été acceptée" : "Your booking was accepted"}</h1>
<p style="${pStyle}">${welperName} ${fr ? "a accepté votre demande pour" : "has accepted your request for"} <strong>${serviceName}</strong>.</p>
${date ? `<p style="${pStyle}"><strong>${fr ? "Quand" : "When"}:</strong> ${date}${time ? `, ${time}` : ""}</p>` : ""}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    case "booking_declined": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre demande" : "your request"));
      const reason = v.declineReason
        ? `<p style="${pStyle}"><strong>${fr ? "Raison" : "Reason"}:</strong> ${escapeHtml(v.declineReason)}</p>`
        : "";
      content = `
<h1 style="${h1Style}">${fr ? "Demande de réservation refusée" : "Booking request declined"}</h1>
<p style="${pStyle}">${fr ? "Malheureusement, votre demande pour" : "Unfortunately your booking request for"} <strong>${serviceName}</strong> ${fr ? "a été refusée." : "was declined."}</p>
${reason}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${findWelper}</a></p>`;
      break;
    }
    case "booking_cancelled": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "la réservation" : "the booking"));
      const reason = v.cancellationReason
        ? `<p style="${pStyle}"><strong>${fr ? "Raison" : "Reason"}:</strong> ${escapeHtml(v.cancellationReason)}</p>`
        : "";
      content = `
<h1 style="${h1Style}">${fr ? "Réservation annulée" : "Booking cancelled"}</h1>
<p style="${pStyle}">${serviceName} ${fr ? "a été annulée." : "has been cancelled."}</p>
${reason}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBookings}</a></p>`;
      break;
    }
    case "booking_checked_in": {
      const welperName = escapeHtml(v.welperName || (fr ? "Votre Welper" : "Your welper"));
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      content = `
<h1 style="${h1Style}">${fr ? "Le Welper s\u2019est enregistré" : "Welper has checked in"}</h1>
<p style="${pStyle}">${welperName} ${fr ? "s\u2019est enregistré pour" : "has checked in for"} <strong>${serviceName}</strong>.</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    case "booking_completed": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      content = `
<h1 style="${h1Style}">${fr ? "Service terminé" : "Service completed"}</h1>
<p style="${pStyle}">${fr ? "Votre réservation pour" : "Your booking for"} <strong>${serviceName}</strong> ${fr ? "est terminée. Merci d\u2019utiliser Welpco\u00a0!" : "is complete. Thank you for using Welpco!"}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    case "booking_service_receipt": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      const amount = escapeHtml(v.totalPrice || "");
      content = `
<h1 style="${h1Style}">${fr ? "Reçu de service" : "Service receipt"}</h1>
<p style="${pStyle}">${fr ? "Votre Welper a soumis un reçu pour" : "Your welper submitted a receipt for"} <strong>${serviceName}</strong>.</p>
${amount ? `<p style="${pStyle}"><strong>${fr ? "Montant facturé" : "Amount charged"}:</strong> $${amount} CAD</p>` : ""}
<p style="${pStyle}">${fr ? "Ouvrez votre réservation pour consulter les détails. Si quelque chose ne va pas, vous pouvez signaler un problème depuis la page de la réservation." : "Open your booking to review details. If something looks wrong, you can start a dispute from the booking page."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    case "booking_service_submitted": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      const amount = escapeHtml(v.totalPrice || "");
      content = `
<h1 style="${h1Style}">${fr ? "Reçu de service soumis" : "Service receipt submitted"}</h1>
<p style="${pStyle}">${fr ? "Vous avez soumis un reçu pour" : "You submitted a receipt for"} <strong>${serviceName}</strong>.</p>
${amount ? `<p style="${pStyle}"><strong>${fr ? "Montant" : "Amount"}:</strong> $${amount} CAD</p>` : ""}
<p style="${pStyle}">${fr ? "Le client en sera avisé. Le paiement sera traité selon les détails du reçu." : "The customer will be notified. Payment will be processed according to the receipt details."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    case "booking_payment_released": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      content = `
<h1 style="${h1Style}">${fr ? "Réservation finalisée" : "Booking finalized"}</h1>
<p style="${pStyle}">${fr ? "Le paiement pour" : "Payment for"} <strong>${serviceName}</strong> ${fr ? "est finalisé. Cette réservation est maintenant close." : "is complete. This booking is now closed."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>`;
      break;
    }
    default:
      content = `<p style="${pStyle}">${fr ? "Vous avez une mise à jour de réservation." : "You have a booking update."}</p>`;
  }

  return wrapEmail({
    content,
    locale,
    documentTitle: title,
    publicAppUrl: params.publicAppUrl,
  });
}
