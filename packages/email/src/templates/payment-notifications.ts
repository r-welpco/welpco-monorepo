import { escapeHtml, wrapEmail } from "../layout";
import { btnStyle, h1Style, pStyle } from "../styles";
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
  failureReason?: string;
}

export type PaymentNotificationCopy = {
  title: string;
  body: string;
};

function isFr(locale?: EmailLocale): boolean {
  return locale === "fr";
}

export function getPaymentEmailSubject(type: PaymentEmailType, locale: EmailLocale = "en"): string {
  const fr = isFr(locale);
  switch (type) {
    case "payment_captured_customer":
      return fr ? "Paiement reçu – Welpco" : "Payment received – Welpco";
    case "payment_captured_welper":
      return fr ? "Versement en cours – Welpco" : "Payout queued – Welpco";
    case "payment_failed":
      return fr ? "Problème de paiement – Welpco" : "Payment problem – Welpco";
    case "payment_refund":
      return fr ? "Remboursement émis – Welpco" : "Refund issued – Welpco";
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
          ? `${amountLabel} a été facturé pour votre réservation. Le reçu se trouve dans les détails de la réservation.`
          : `${amountLabel} was charged for your booking. The receipt is in your booking details.`,
      };
    case "payment_captured_welper":
      return {
        title: fr ? "Versement en cours" : "Payout queued",
        body: fr
          ? `${amountLabel} d\u2019une récente réservation est en route vers votre compte de versement.`
          : `${amountLabel} from a recent booking is on its way to your payout account.`,
      };
    case "payment_failed": {
      const detail = variables.failureReason?.trim()
        ? fr
          ? ` Raison\u00a0: ${variables.failureReason.trim()}.`
          : ` Reason: ${variables.failureReason.trim()}.`
        : "";
      return {
        title: fr ? "Problème de paiement" : "Payment problem",
        body: fr
          ? `Nous n\u2019avons pas pu traiter le paiement de votre réservation.${detail} Veuillez mettre à jour votre mode de paiement dans les Paramètres.`
          : `We couldn't process the payment for your booking.${detail} Please update your payment method in Settings.`,
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
  const copy = getPaymentNotificationCopy(type, locale, v);
  const bookingUrl = v.bookingUrl ?? "#";
  const openBooking = fr ? "Ouvrir la réservation" : "Open booking";
  const safeBody = escapeHtml(copy.body);

  const content = `
<h1 style="${h1Style}">${escapeHtml(copy.title)}</h1>
<p style="${pStyle}">${safeBody}</p>
<p style="margin-top: 20px;"><a href="${bookingUrl}" style="${btnStyle}">${openBooking}</a></p>`;

  return wrapEmail({
    content,
    locale,
    documentTitle: title,
    publicAppUrl: params.publicAppUrl,
  });
}
