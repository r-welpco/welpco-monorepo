import { escapeHtml, wrapEmail } from "../layout";
import { btnStyle, h1Style, mutedStyle, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export type PaymentEmailType =
  | "payment_captured_customer"
  | "payment_captured_welper"
  | "payment_failed"
  | "payment_refund";

export interface PaymentEmailVariables {
  amount?: string;
  currency?: string;
  bookingUrl?: string;
  updatePaymentUrl?: string;
  failureReason?: string;
  firstName?: string;
}

export type PaymentNotificationCopy = {
  title: string;
  body: string;
};

function isFr(locale?: EmailLocale): boolean {
  return locale === "fr";
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

export function getPaymentEmailSubject(type: PaymentEmailType, locale: EmailLocale = "en"): string {
  const fr = isFr(locale);
  switch (type) {
    case "payment_captured_customer":
      return fr ? "Paiement reçu pour votre réservation" : "Payment received for your booking";
    case "payment_captured_welper":
      return fr ? "Versement en cours" : "Payout queued";
    case "payment_failed":
      return fr ? "Problème de paiement avec votre réservation" : "Payment issue with your booking";
    case "payment_refund":
      return fr ? "Remboursement émis" : "Refund issued";
    default:
      return fr ? "Mise à jour de paiement – Welpco" : "Payment update – Welpco";
  }
}

export function getPaymentNotificationCopy(
  type: PaymentEmailType,
  locale: EmailLocale = "en",
  variables: PaymentEmailVariables = {},
): PaymentNotificationCopy {
  const fr = isFr(locale);
  const amount = variables.amount ?? "";
  const currency = (variables.currency ?? "CAD").toUpperCase();
  const amountLabel = amount ? `${amount} ${currency}` : "";

  switch (type) {
    case "payment_captured_customer":
      return {
        title: fr ? "Paiement reçu" : "Payment received",
        body: fr
          ? "Votre paiement a bien été reçu pour votre réservation Welpco. Le paiement sera traité conformément au fonctionnement de la plateforme."
          : "Your payment has been received for your Welpco booking. The payment will be processed according to how the platform works.",
      };
    case "payment_captured_welper":
      return {
        title: fr ? "Versement en cours" : "Payout queued",
        body: fr
          ? `${amountLabel} d\u2019une récente réservation sera versé sur votre compte Stripe Connect le prochain lundi admissible (au moins 24 heures après la libération du paiement).`
          : `${amountLabel} from a recent booking will be transferred to your Stripe Connect account on the next eligible Monday (at least 24 hours after payment is released).`,
      };
    case "payment_failed": {
      return {
        title: fr ? "Problème de paiement" : "Payment issue",
        body: fr
          ? "Nous n\u2019avons pas été en mesure de traiter le paiement lié à votre réservation Welpco. Veuillez mettre à jour vos informations de paiement afin que votre réservation puisse continuer."
          : "We were unable to process the payment for your Welpco booking. Please update your payment information so your booking can continue.",
      };
    }
    case "payment_refund":
      return {
        title: fr ? "Remboursement émis" : "Refund issued",
        body: fr
          ? `Un remboursement de ${amountLabel} a été émis pour votre réservation. Il peut prendre quelques jours ouvrables avant d\u2019apparaître sur votre relevé.`
          : `A refund of ${amountLabel} was issued for your booking. It can take a few business days to appear on your statement.`,
      };
    default:
      return {
        title: fr ? "Mise à jour de paiement" : "Payment update",
        body: fr ? "Vous avez une mise à jour de paiement." : "You have a payment update.",
      };
  }
}

export function getPaymentEmailHtml(params: {
  type: PaymentEmailType;
  variables: PaymentEmailVariables;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const v = params.variables;
  const type = params.type;
  const title = getPaymentEmailSubject(type, locale);
  const bookingUrl = v.bookingUrl ?? "#";
  const updatePaymentUrl = v.updatePaymentUrl || bookingUrl;

  let content: string;
  switch (type) {
    case "payment_captured_customer":
      content = `
<h1 style="${h1Style}">${fr ? "Paiement reçu pour votre réservation" : "Payment received for your booking"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Votre paiement a bien été reçu pour votre réservation Welpco."
        : "Your payment has been received for your Welpco booking."}</p>
<p style="${pStyle}">${fr
        ? "Le paiement sera traité conformément au fonctionnement de la plateforme."
        : "The payment will be processed according to how the platform works."}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez consulter les détails de votre réservation dans votre compte."
        : "You can view your booking details in your account."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${fr ? "Voir ma réservation" : "View my booking"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    case "payment_failed":
      content = `
<h1 style="${h1Style}">${fr ? "Problème de paiement avec votre réservation" : "Payment issue with your booking"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Nous n\u2019avons pas été en mesure de traiter le paiement lié à votre réservation Welpco."
        : "We were unable to process the payment for your Welpco booking."}</p>
<p style="${pStyle}">${fr
        ? "Veuillez vous connecter à votre compte et mettre à jour vos informations de paiement afin que votre réservation puisse continuer."
        : "Please log into your account and update your payment information so your booking can continue."}</p>
${v.failureReason?.trim()
  ? `<p style="${pStyle}"><strong>${fr ? "Détail" : "Detail"}:</strong> ${escapeHtml(v.failureReason.trim())}</p>`
  : ""}
<p style="margin-top: 20px;"><a href="${updatePaymentUrl}" style="${btnStyle}">${fr ? "Mettre à jour mon paiement" : "Update payment information"}</a></p>
<p style="${pStyle}">${fr ? "Besoin d\u2019aide? Répondez simplement à ce courriel." : "Need help? Simply reply to this email."}</p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    case "payment_captured_welper": {
      const amount = v.amount ?? "";
      const currency = (v.currency ?? "CAD").toUpperCase();
      const amountLabel = amount ? `${escapeHtml(amount)} ${escapeHtml(currency)}` : "";
      content = `
<h1 style="${h1Style}">${fr ? "Versement en cours" : "Payout queued"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr ? "Bonne nouvelle!" : "Good news!"}</p>
<p style="${pStyle}">${fr
        ? `${amountLabel || "Un montant"} d\u2019une récente réservation sera versé sur votre compte Stripe Connect le prochain lundi admissible (au moins 24 heures après la libération du paiement).`
        : `${amountLabel || "An amount"} from a recent booking will be transferred to your Stripe Connect account on the next eligible Monday (at least 24 hours after payment is released).`}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez consulter les détails de la réservation dans votre compte."
        : "You can review the booking details in your account."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${fr ? "Voir la réservation" : "View booking"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "payment_refund": {
      const amount = v.amount ?? "";
      const currency = (v.currency ?? "CAD").toUpperCase();
      const amountLabel = amount ? `${escapeHtml(amount)} ${escapeHtml(currency)}` : "";
      content = `
<h1 style="${h1Style}">${fr ? "Remboursement émis" : "Refund issued"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Un remboursement${amountLabel ? ` de ${amountLabel}` : ""} a été émis pour votre réservation.`
        : `A refund${amountLabel ? ` of ${amountLabel}` : ""} was issued for your booking.`}</p>
<p style="${pStyle}">${fr
        ? "Il peut prendre quelques jours ouvrables avant d\u2019apparaître sur votre relevé."
        : "It can take a few business days to appear on your statement."}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez consulter les détails de la réservation dans votre compte."
        : "You can review the booking details in your account."}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${fr ? "Voir ma réservation" : "View my booking"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    default: {
      const copy = getPaymentNotificationCopy(type, locale, v);
      content = `
<h1 style="${h1Style}">${escapeHtml(copy.title)}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${escapeHtml(copy.body)}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${fr ? "Ouvrir la réservation" : "Open booking"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
    }
  }

  return wrapEmail({
    content,
    locale,
    documentTitle: title,
    publicAppUrl: params.publicAppUrl,
  });
}
