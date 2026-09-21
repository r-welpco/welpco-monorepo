import { escapeHtml, wrapEmail } from "../layout";
import { btnStyle, h1Style, mutedStyle, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface BookingEmailVariables {
  customerName?: string;
  welperName?: string;
  firstName?: string;
  serviceName?: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  totalPrice?: string;
  bookingUrl?: string;
  searchUrl?: string;
  reviewUrl?: string;
  declineReason?: string;
  cancellationReason?: string;
  /** Who cancelled: customer | welper | admin | system */
  cancelledByRole?: "customer" | "welper" | "admin" | "system";
  /** Whether cancel is within the free window (>24h before service). Accepts boolean or "true"/"false" string from notify plumbing. */
  cancelWithinFreeWindow?: boolean | "true" | "false";
  /** Recipient side for cancellation variant selection */
  cancelRecipientRole?: "customer" | "welper";
}

export type BookingEmailType =
  | "booking_created"
  | "booking_request_sent"
  | "booking_accepted"
  | "booking_accepted_welper"
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
  if (v.startTime) return v.startTime;
  return "";
}

function dateTimeLabel(v: BookingEmailVariables): string {
  const date = v.scheduledDate?.trim() || "";
  const time = timeRange(v);
  if (date && time) return `${date}, ${time}`;
  return date || time || "";
}

function greeting(firstName: string | undefined, locale: EmailLocale): string {
  const safe = firstName?.trim() ? escapeHtml(firstName.trim()) : null;
  if (locale === "fr") {
    return safe ? `Bonjour ${safe},` : "Bonjour,";
  }
  return safe ? `Hello ${safe},` : "Hello,";
}

function thanks(locale: EmailLocale): string {
  return isFr(locale) ? "Merci,<br>L\u2019équipe Welpco" : "Thank you,<br>The Welpco Team";
}

export type CancellationVariant =
  | "customer_self_free"
  | "customer_self_late"
  | "customer_welper_free"
  | "customer_welper_late"
  | "welper_customer_free"
  | "welper_customer_late"
  | "welper_self_free"
  | "welper_self_late"
  | "generic";

export function resolveCancellationVariant(variables: BookingEmailVariables): CancellationVariant {
  const recipient = variables.cancelRecipientRole;
  const by = variables.cancelledByRole;
  const freeFlag = variables.cancelWithinFreeWindow;
  const free = freeFlag !== false && freeFlag !== "false";

  if (!recipient || !by || by === "admin" || by === "system") {
    return "generic";
  }

  if (recipient === "customer") {
    if (by === "customer") return free ? "customer_self_free" : "customer_self_late";
    if (by === "welper") return free ? "customer_welper_free" : "customer_welper_late";
  }

  if (recipient === "welper") {
    if (by === "customer") return free ? "welper_customer_free" : "welper_customer_late";
    if (by === "welper") return free ? "welper_self_free" : "welper_self_late";
  }

  return "generic";
}

export function getBookingEmailSubject(type: BookingEmailType, locale: EmailLocale = "en", variables: BookingEmailVariables = {}): string {
  const fr = isFr(locale);
  switch (type) {
    case "booking_created":
      return fr ? "Vous avez une nouvelle demande de réservation" : "You have a new booking request";
    case "booking_request_sent":
      return fr ? "Demande de réservation envoyée – Welpco" : "Booking request sent – Welpco";
    case "booking_accepted":
      return fr ? "Confirmation de réservation Welpco" : "Welpco booking confirmation";
    case "booking_accepted_welper":
      return fr ? "Confirmation de réservation Welpco" : "Welpco booking confirmation";
    case "booking_declined":
      return fr ? "Votre réservation a été refusée" : "Your booking was declined";
    case "booking_cancelled": {
      const variant = resolveCancellationVariant(variables);
      if (variant === "customer_welper_free" || variant === "customer_welper_late") {
        return fr ? "Votre Welper a annulé la réservation" : "Your Welper cancelled the booking";
      }
      if (variant === "welper_customer_free" || variant === "welper_customer_late") {
        return fr ? "Une réservation a été annulée" : "A booking has been cancelled";
      }
      return fr ? "Votre réservation a été annulée" : "Your booking has been cancelled";
    }
    case "booking_checked_in":
      return fr ? "Le Welper s\u2019est enregistré" : "Welper has checked in";
    case "booking_completed":
      return fr ? "Service terminé" : "Service completed";
    case "booking_service_receipt":
      return fr ? "Laissez un avis sur votre Welper" : "Leave a review for your Welper";
    case "booking_service_submitted":
      return fr ? "Votre service a été complété" : "Your service has been completed";
    case "booking_payment_released":
      return fr ? "Réservation finalisée" : "Booking finalized";
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
  const serviceName = variables.serviceName || "Service";
  const welperName = variables.welperName || (fr ? "Votre Welper" : "Your welper");
  const customerName = variables.customerName || (fr ? "Un client" : "A customer");
  const when = dateTimeLabel(variables);

  switch (type) {
    case "booking_created":
      return {
        title: fr ? "Nouvelle demande de réservation" : "New booking request",
        body: fr
          ? `Un client souhaite réserver vos services${when ? ` pour ${when}` : ""}.`
          : `A customer would like to book your services${when ? ` for ${when}` : ""}.`,
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
        title: fr ? "Confirmation de réservation" : "Booking confirmation",
        body: fr
          ? `Réservation confirmée avec ${welperName}${when ? ` pour ${when}` : ""}.`
          : `Booking confirmed with ${welperName}${when ? ` for ${when}` : ""}.`,
      };
    case "booking_accepted_welper":
      return {
        title: fr ? "Confirmation de réservation" : "Booking confirmation",
        body: fr
          ? `Réservation confirmée avec ${customerName}${when ? ` pour ${when}` : ""}.`
          : `Booking confirmed with ${customerName}${when ? ` for ${when}` : ""}.`,
      };
    case "booking_declined":
      return {
        title: fr ? "Réservation refusée" : "Booking declined",
        body: fr
          ? `Le Welper a refusé votre réservation pour ${serviceName}.`
          : `The Welper declined your booking for ${serviceName}.`,
      };
    case "booking_cancelled": {
      const variant = resolveCancellationVariant(variables);
      if (variant.startsWith("customer_welper") || variant.startsWith("welper_customer")) {
        return {
          title: fr ? "Réservation annulée" : "Booking cancelled",
          body: fr
            ? `La réservation pour ${serviceName}${when ? ` (${when})` : ""} a été annulée.`
            : `The booking for ${serviceName}${when ? ` (${when})` : ""} was cancelled.`,
        };
      }
      return {
        title: fr ? "Réservation annulée" : "Booking cancelled",
        body: fr
          ? `La réservation pour ${serviceName} a été annulée.`
          : `The booking for ${serviceName} was cancelled.`,
      };
    }
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
        title: fr ? "Laissez un avis" : "Leave a review",
        body: fr
          ? `Votre service avec ${welperName} est terminé. Laissez un avis et consultez votre facture.`
          : `Your service with ${welperName} is complete. Leave a review and view your invoice.`,
      };
    case "booking_service_submitted":
      return {
        title: fr ? "Service complété" : "Service completed",
        body: fr
          ? `Vous avez complété votre service avec ${customerName}. Votre paiement sera ajouté à votre versement hebdomadaire.`
          : `You completed your service with ${customerName}. Your payment will be added to your weekly payout.`,
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

export type WelcomeAccountType = "customer" | "welper";

export function getWelcomeEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "Bienvenue chez Welpco" : "Welcome to Welpco";
}

export function getWelcomeEmailHtml(
  firstName: string | undefined,
  dashboardUrl: string,
  locale: EmailLocale = "en",
  publicAppUrl?: string,
  guideUrl?: string,
  accountType?: WelcomeAccountType,
): string {
  const fr = isFr(locale);
  const title = getWelcomeEmailSubject(locale);
  const role: WelcomeAccountType = accountType === "welper" ? "welper" : "customer";

  let body: string;
  if (role === "welper") {
    body = fr
      ? `
<p style="${pStyle}">${greeting(firstName, locale)}</p>
<p style="${pStyle}">Au nom de Welpco, nous souhaitons vous souhaiter la bienvenue sur notre plateforme canadienne de services domestiques. Nous avons créé une plateforme qui facilite les besoins des citoyens canadiens et qui connecte les personnes au sein des communautés.</p>
<p style="${pStyle}">En tant que Welper, vous avez la liberté de créer votre propre horaire et de sélectionner les services que vous souhaitez offrir. Il n\u2019y a aucune limite minimale ou maximale d\u2019heures de travail.</p>
<p style="${pStyle}">Lors de la détermination de votre tarif horaire, certains éléments doivent être pris en compte, notamment les déplacements vers le lieu du service. Welpco ajoute également des frais à votre tarif horaire, payés par le client et inclus dans le tarif affiché. Ces frais servent à couvrir les coûts opérationnels, le marketing ainsi que le support client et Welper.</p>
<p style="${pStyle}">Le seul montant déduit de votre tarif correspond aux taxes applicables. Comme vous n\u2019êtes pas employé de Welpco, aucun T4 ne sera émis, mais un T4A vous sera fourni si vos revenus dépassent les seuils fixés par le gouvernement fédéral.</p>
<p style="${pStyle}">Enfin, un bon service ainsi qu\u2019une attitude positive et polie sont essentiels. Les avis laissés par les clients seront visibles sur votre profil, et les Welpers les mieux notés auront plus de visibilité et d\u2019opportunités.</p>
<p style="${pStyle}">Nous vous souhaitons le meilleur. N\u2019oubliez pas de compléter votre profil afin de commencer à générer des revenus.</p>`
      : `
<p style="${pStyle}">${greeting(firstName, locale)}</p>
<p style="${pStyle}">On behalf of Welpco, we would like to welcome you to our Canadian domestic services platform. We created a platform that helps meet the needs of Canadians and connects people within their communities.</p>
<p style="${pStyle}">As a Welper, you have the freedom to create your own schedule and select the services you want to offer. There is no minimum or maximum number of hours required.</p>
<p style="${pStyle}">When setting your hourly rate, certain elements should be considered, including travel to the service location. Welpco also adds fees to your hourly rate, paid by the customer and included in the displayed rate. These fees help cover operational costs, marketing, and customer and Welper support.</p>
<p style="${pStyle}">The only amount deducted from your rate corresponds to applicable taxes. Since you are not an employee of Welpco, no T4 will be issued, but a T4A will be provided if your earnings exceed the thresholds set by the federal government.</p>
<p style="${pStyle}">Finally, good service and a positive, polite attitude are essential. Customer reviews will be visible on your profile, and top-rated Welpers may receive more visibility and opportunities.</p>
<p style="${pStyle}">We wish you the best. Don\u2019t forget to complete your profile so you can start earning.</p>`;
  } else {
    body = fr
      ? `
<p style="${pStyle}">${greeting(firstName, locale)}</p>
<p style="${pStyle}">Au nom de Welpco, nous souhaitons vous souhaiter la bienvenue sur notre plateforme canadienne de services domestiques.</p>
<p style="${pStyle}">Nous comprenons que la vie peut être bien remplie et qu\u2019il y a parfois des tâches à accomplir, mais que le temps manque. Welpco est là pour vous faciliter la vie.</p>
<p style="${pStyle}">Explorez les nombreux types de services domestiques disponibles dans votre région, offerts par des personnes de votre communauté. Parcourez les Welpers près de chez vous et réservez le service dont vous avez besoin sur notre plateforme simple d\u2019utilisation.</p>
<p style="${pStyle}">Vous pourrez communiquer avec le Welper une fois la réservation confirmée et, une fois le service complété, vous pourrez laisser un avis.</p>
<p style="${pStyle}">Nous apprécions tout commentaire ou suggestion de votre part. Si vous avez des questions ou des préoccupations, n\u2019hésitez pas à nous contacter.</p>`
      : `
<p style="${pStyle}">${greeting(firstName, locale)}</p>
<p style="${pStyle}">On behalf of Welpco, we would like to welcome you to our Canadian domestic services platform.</p>
<p style="${pStyle}">We understand that life can be busy and that sometimes there are tasks to complete, but not enough time to do them. Welpco is here to make your life easier.</p>
<p style="${pStyle}">Explore the many types of domestic services available in your area, offered by people in your community. Browse Welpers near you and book the service you need through our easy-to-use platform.</p>
<p style="${pStyle}">You will be able to communicate with your Welper once the booking is confirmed and, once the service is completed, you will be able to leave a review.</p>
<p style="${pStyle}">We appreciate any feedback or suggestions you may have. If you have any questions or concerns, please contact us.</p>`;
  }

  const cta = fr ? "Accéder au tableau de bord" : "Go to Dashboard";
  const guideLabel = fr ? "Consultez le guide de démarrage" : "Read the getting-started guide";
  const guideLink = guideUrl
    ? `<p style="margin-top: 12px; font-size: 14px;"><a href="${guideUrl}" style="color: #00492F; text-decoration: underline;">${guideLabel}</a></p>`
    : "";

  const content = `
<h1 style="${h1Style}">${title}</h1>
${body}
<p style="margin-top: 24px;"><a href="${dashboardUrl}" style="${btnStyle}">${cta}</a></p>
${guideLink}
<p style="${mutedStyle}">${thanks(locale)}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl });
}

function cancellationHtml(
  variant: CancellationVariant,
  v: BookingEmailVariables,
  locale: EmailLocale,
): string {
  const fr = isFr(locale);
  const welperName = escapeHtml(v.welperName || (fr ? "votre Welper" : "your Welper"));
  const customerName = escapeHtml(v.customerName || (fr ? "le client" : "the customer"));
  const when = escapeHtml(dateTimeLabel(v) || (fr ? "la date prévue" : "the scheduled time"));
  const searchUrl = v.searchUrl || v.bookingUrl || "#";
  const bookingUrl = v.bookingUrl || "#";
  const browseWelpers = fr ? "Voir d\u2019autres Welpers" : "View other Welpers";
  const browseJobs = fr ? "Voir les services disponibles" : "View available services";
  const viewBookings = fr ? "Voir mes réservations" : "View my bookings";

  switch (variant) {
    case "customer_self_free":
      return `
<h1 style="${h1Style}">${fr ? "Votre réservation a été annulée" : "Your booking has been cancelled"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Ceci confirme que vous avez annulé avec succès votre réservation avec ${welperName} prévue pour ${when}.`
        : `This confirms that you have successfully cancelled your booking with ${welperName} scheduled for ${when}.`}</p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    case "customer_self_late":
      return `
<h1 style="${h1Style}">${fr ? "Votre réservation a été annulée" : "Your booking has been cancelled"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Ceci confirme que vous avez annulé votre réservation avec ${welperName} prévue pour ${when}.`
        : `This confirms that you have cancelled your booking with ${welperName} scheduled for ${when}.`}</p>
<p style="${pStyle}">${fr
        ? "Comme indiqué dans notre politique d\u2019annulation, une heure de service sera retenue et le reste vous sera remboursé."
        : "As stated in our cancellation policy, one hour of service will be retained and the rest will be refunded to you."}</p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    case "customer_welper_free":
    case "customer_welper_late":
      return `
<h1 style="${h1Style}">${fr ? "Votre Welper a annulé la réservation" : "Your Welper cancelled the booking"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Malheureusement, votre Welper ${welperName} a annulé votre service prévu pour ${when}. Un remboursement complet sera effectué.`
        : `Unfortunately, your Welper ${welperName} has cancelled your service scheduled for ${when}. A full refund will be issued.`}</p>
<p style="${pStyle}">${fr
        ? "Voici des recommandations de Welpers qui pourraient vous aider rapidement\u00a0:"
        : "Here are recommended Welpers who may be able to help you quickly:"}</p>
<p style="margin-top: 20px;"><a href="${searchUrl}" style="${btnStyle}">${browseWelpers}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    case "welper_customer_free":
      return `
<h1 style="${h1Style}">${fr ? "Une réservation a été annulée" : "A booking has been cancelled"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Malheureusement, ${customerName} a annulé le service prévu pour ${when}.`
        : `Unfortunately, ${customerName} has cancelled the service scheduled for ${when}.`}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez cliquer sur le lien ci-dessous pour voir les services actuellement disponibles dans votre région et planifier votre prochaine réservation\u00a0:"
        : "You can click the link below to view services currently available in your area and plan your next booking:"}</p>
<p style="margin-top: 20px;"><a href="${searchUrl}" style="${btnStyle}">${browseJobs}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    case "welper_customer_late":
      return `
<h1 style="${h1Style}">${fr ? "Une réservation a été annulée" : "A booking has been cancelled"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Malheureusement, ${customerName} a annulé le service prévu pour ${when}.`
        : `Unfortunately, ${customerName} has cancelled the service scheduled for ${when}.`}</p>
<p style="${pStyle}">${fr
        ? "Comme le client a annulé avec moins de 24 heures de préavis, une pénalité équivalente à 1 heure sera retenue. Les frais applicables seront déduits, et le montant restant sera ajouté à votre paiement hebdomadaire."
        : "Since the customer cancelled with less than 24 hours\u2019 notice, a penalty equivalent to 1 hour will be retained. Applicable fees will be deducted, and the remaining amount will be added to your weekly payout."}</p>
<p style="margin-top: 20px;"><a href="${searchUrl}" style="${btnStyle}">${browseJobs}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    case "welper_self_free":
      return `
<h1 style="${h1Style}">${fr ? "Votre réservation a été annulée" : "Your booking has been cancelled"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Ceci confirme que vous avez annulé avec succès votre réservation avec ${customerName} prévue pour ${when}.`
        : `This confirms that you have successfully cancelled your booking with ${customerName} scheduled for ${when}.`}</p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    case "welper_self_late":
      return `
<h1 style="${h1Style}">${fr ? "Votre réservation a été annulée" : "Your booking has been cancelled"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Ceci confirme que vous avez annulé avec succès votre réservation avec ${customerName} prévue pour ${when}.`
        : `This confirms that you have successfully cancelled your booking with ${customerName} scheduled for ${when}.`}</p>
<p style="${pStyle}">${fr
        ? "Veuillez noter que, conformément à la politique d\u2019annulation de Welpco, le client recevra un remboursement complet."
        : "Please note that, according to Welpco\u2019s cancellation policy, the customer will receive a full refund."}</p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    default: {
      const serviceName = escapeHtml(v.serviceName || (fr ? "la réservation" : "the booking"));
      const reason = v.cancellationReason
        ? `<p style="${pStyle}"><strong>${fr ? "Raison" : "Reason"}:</strong> ${escapeHtml(v.cancellationReason)}</p>`
        : "";
      return `
<h1 style="${h1Style}">${fr ? "Réservation annulée" : "Booking cancelled"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${serviceName} ${fr ? "a été annulée." : "has been cancelled."}</p>
${reason}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBookings}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    }
  }
}

export function getBookingEmailHtml(params: BookingEmailTemplateParams): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const v = params.variables;
  const bookingUrl = v.bookingUrl ?? "#";
  const searchUrl = v.searchUrl || bookingUrl;
  const reviewUrl = v.reviewUrl || bookingUrl;
  const type = params.type;
  const title = getBookingEmailSubject(type, locale, v);
  const viewBooking = fr ? "Voir la réservation" : "View booking";
  const when = escapeHtml(dateTimeLabel(v));

  let content: string;

  switch (type) {
    case "booking_created": {
      content = `
<h1 style="${h1Style}">${fr ? "Vous avez une nouvelle demande de réservation" : "You have a new booking request"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Bonne nouvelle! Un client souhaite réserver vos services sur Welpco."
        : "Good news! A customer would like to book your services on Welpco."}</p>
<p style="${pStyle}">${fr
        ? "Veuillez vous connecter à votre compte pour consulter les détails de la demande et y répondre dès que possible."
        : "Please log into your account to review the booking details and respond as soon as possible."}</p>
${when ? `<p style="${pStyle}"><strong>${fr ? "Quand" : "When"}:</strong> ${when}</p>` : ""}
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${fr ? "Voir la demande" : "View booking request"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_request_sent": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      const welperName = escapeHtml(v.welperName || (fr ? "votre Welper" : "your welper"));
      content = `
<h1 style="${h1Style}">${fr ? "Demande de réservation envoyée" : "Booking request sent"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Votre demande de réservation pour <strong>${serviceName}</strong> a été envoyée à ${welperName}. Vous serez avisé dès sa réponse.`
        : `Your booking request for <strong>${serviceName}</strong> was sent to ${welperName}. You'll be notified when they respond.`}</p>
${when ? `<p style="${pStyle}"><strong>${fr ? "Quand" : "When"}:</strong> ${when}</p>` : ""}
<p style="${pStyle}">${fr ? "Aucun frais avant la fin du service." : "No charge until after the job is done."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_accepted": {
      const welperName = escapeHtml(v.welperName || (fr ? "votre Welper" : "your Welper"));
      const serviceName = escapeHtml(v.serviceName || (fr ? "le service" : "the service"));
      content = `
<h1 style="${h1Style}">${fr ? "Confirmation de réservation Welpco" : "Welpco booking confirmation"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Ceci confirme votre réservation avec ${welperName}, prévue pour ${when || "la date convenue"}, pour ${serviceName}.`
        : `This confirms your booking with ${welperName}, scheduled for ${when || "the scheduled time"}, for ${serviceName}.`}</p>
<p style="${pStyle}">${fr
        ? "Vous êtes responsable de communiquer vos besoins au Welper et de superviser le service. Welpco ne supervise pas, ne dirige pas et ne contrôle pas le travail des Welpers, car ils sont des travailleurs indépendants."
        : "You are responsible for communicating your needs to the Welper and supervising the service. Welpco does not supervise, direct or control the work of Welpers, as they are independent workers."}</p>
<p style="${pStyle}">${fr
        ? "Si vous n\u2019êtes pas présent, veuillez fournir toutes les instructions nécessaires au Welper pour compléter le travail selon vos attentes. Sinon, le Welper peut vous contacter via la messagerie Welpco pour obtenir les informations nécessaires."
        : "If you will not be present, please provide all necessary instructions to the Welper so the work can be completed according to your expectations. Otherwise, the Welper may contact you through Welpco messaging to obtain the required information."}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez également communiquer avec votre Welper à tout moment entre la réservation et la fin du service."
        : "You may also communicate with your Welper at any time between the booking and the end of the service."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_accepted_welper": {
      const customerName = escapeHtml(v.customerName || (fr ? "le client" : "the customer"));
      const serviceName = escapeHtml(v.serviceName || (fr ? "le service" : "the service"));
      content = `
<h1 style="${h1Style}">${fr ? "Confirmation de réservation Welpco" : "Welpco booking confirmation"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Ceci confirme votre réservation avec ${customerName}, prévue pour ${when || "la date convenue"}, pour ${serviceName}.`
        : `This confirms your booking with ${customerName}, scheduled for ${when || "the scheduled time"}, for ${serviceName}.`}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez communiquer avec le client via la messagerie Welpco avant le service si vous avez besoin de précisions."
        : "You can communicate with the customer through Welpco messaging before the service if you need any details."}</p>
<p style="${pStyle}">${fr
        ? "N\u2019oubliez pas d\u2019arriver à l\u2019heure et d\u2019indiquer votre arrivée ou le début du service dans l\u2019application."
        : "Don\u2019t forget to arrive on time and indicate your arrival or the start of the service in the app."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_declined": {
      const reason = v.declineReason
        ? `<p style="${pStyle}"><strong>${fr ? "Raison" : "Reason"}:</strong> ${escapeHtml(v.declineReason)}</p>`
        : "";
      content = `
<h1 style="${h1Style}">${fr ? "Votre réservation a été refusée" : "Your booking was declined"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Malheureusement, le Welper a refusé votre réservation."
        : "Unfortunately, the Welper declined your booking."}</p>
${reason}
<p style="${pStyle}">${fr
        ? "Veuillez cliquer sur le lien ci-dessous pour voir d\u2019autres Welpers disponibles dans votre région\u00a0:"
        : "Please click the link below to view other available Welpers in your area:"}</p>
<p style="margin-top: 20px;"><a href="${searchUrl}" style="${btnStyle}">${fr ? "Voir d\u2019autres Welpers" : "View other Welpers"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_cancelled": {
      content = cancellationHtml(resolveCancellationVariant(v), v, locale);
      break;
    }
    case "booking_checked_in": {
      const welperName = escapeHtml(v.welperName || (fr ? "Votre Welper" : "Your welper"));
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      content = `
<h1 style="${h1Style}">${fr ? "Le Welper s\u2019est enregistré" : "Welper has checked in"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `${welperName} s\u2019est enregistré pour <strong>${serviceName}</strong>.`
        : `${welperName} has checked in for <strong>${serviceName}</strong>.`}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez suivre l\u2019avancement du service et communiquer avec votre Welper via la messagerie Welpco."
        : "You can follow the service progress and message your Welper through Welpco messaging."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_completed": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      content = `
<h1 style="${h1Style}">${fr ? "Service terminé" : "Service completed"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Votre réservation pour <strong>${serviceName}</strong> est maintenant terminée.`
        : `Your booking for <strong>${serviceName}</strong> is now complete.`}</p>
<p style="${pStyle}">${fr
        ? "Merci d\u2019utiliser Welpco. Vous pouvez consulter les détails de la réservation dans votre compte."
        : "Thank you for using Welpco. You can review the booking details in your account."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_service_receipt": {
      const welperName = escapeHtml(v.welperName || (fr ? "votre Welper" : "your Welper"));
      content = `
<h1 style="${h1Style}">${fr ? "Laissez un avis sur votre Welper" : "Leave a review for your Welper"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Nous espérons que votre expérience avec ${welperName} a été satisfaisante et que le service a répondu ou dépassé vos attentes.`
        : `We hope your experience with ${welperName} was satisfactory and that the service met or exceeded your expectations.`}</p>
<p style="${pStyle}">${fr
        ? `Votre facture est disponible dans votre compte. Veuillez nous informer de tout problème et laisser un avis sur ${welperName} afin d\u2019aider les autres utilisateurs dans leurs futures réservations.`
        : `Your invoice is available in your account. Please let us know if there were any issues and leave a review for ${welperName} to help other users with future bookings.`}</p>
<p style="${pStyle}">${fr
        ? "Veuillez noter que toute contestation de facture doit être soumise dans un délai de 24 heures, accompagnée des documents ou photos nécessaires."
        : "Please note that any invoice dispute must be submitted within 24 hours, along with any required documents or photos."}</p>
<p style="margin-top: 20px;"><a href="${reviewUrl}" style="${btnStyle}">${fr ? "Laisser un avis" : "Leave a review"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_service_submitted": {
      const customerName = escapeHtml(v.customerName || (fr ? "le client" : "the customer"));
      content = `
<h1 style="${h1Style}">${fr ? "Votre service a été complété" : "Your service has been completed"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Vous avez complété votre service avec ${customerName} et votre paiement a été reçu.`
        : `You completed your service with ${customerName} and your payment has been received.`}</p>
<p style="${pStyle}">${fr
        ? "Il sera ajouté à votre paiement hebdomadaire, visible dans votre profil Welper."
        : "It will be added to your weekly payout, visible in your Welper profile."}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez également laisser un avis sur votre client en fonction de votre expérience."
        : "You can also leave a review for your customer based on your experience."}</p>
<p style="margin-top: 20px;"><a href="${reviewUrl}" style="${btnStyle}">${fr ? "Laisser un avis" : "Leave a review"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "booking_payment_released": {
      const serviceName = escapeHtml(v.serviceName || (fr ? "votre service" : "your service"));
      content = `
<h1 style="${h1Style}">${fr ? "Réservation finalisée" : "Booking finalized"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Le paiement pour <strong>${serviceName}</strong> est finalisé.`
        : `Payment for <strong>${serviceName}</strong> is complete.`}</p>
<p style="${pStyle}">${fr
        ? "Cette réservation est maintenant close. Vous pouvez encore consulter les détails dans votre compte."
        : "This booking is now closed. You can still review the details in your account."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${viewBooking}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
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
