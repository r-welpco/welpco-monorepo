export type SmsLocale = "en" | "fr";

export type SmsTemplateType =
  | "customer_booking_request_sent"
  | "customer_booking_accepted"
  | "customer_booking_declined"
  | "customer_job_application"
  | "customer_booking_checked_in"
  | "customer_booking_cancelled"
  | "welper_booking_request"
  | "welper_payment_processing"
  | "welper_payment_sent"
  | "welper_booking_cancelled"
  | "welper_dispute_opened"
  | "welper_dispute_resolved";

export interface SmsTemplateVariables {
  welperName?: string;
  customerName?: string;
  jobTitle?: string;
}

function isFr(locale?: SmsLocale): boolean {
  return locale === "fr";
}

function welperLabel(vars: SmsTemplateVariables, locale?: SmsLocale): string {
  const name = vars.welperName?.trim();
  if (name) return name;
  return isFr(locale) ? "votre Welper" : "your Welper";
}

/**
 * Short transactional SMS bodies (EN/FR) from the Welpco SMS flow doc.
 * Keep under typical SMS length; no URLs required (account CTA is in copy).
 */
export function getSmsBody(
  type: SmsTemplateType,
  locale: SmsLocale = "en",
  vars: SmsTemplateVariables = {},
): string {
  const fr = isFr(locale);
  const welper = welperLabel(vars, locale);

  switch (type) {
    case "customer_booking_request_sent":
      return fr
        ? `✅ Votre demande de réservation a été envoyée à ${welper}. Vous recevrez un SMS dès qu'il aura répondu.`
        : `✅ Your booking request has been sent to ${welper}. We'll notify you as soon as they respond.`;

    case "customer_booking_accepted":
      return fr
        ? `🎉 Excellente nouvelle! ${welper} a accepté votre réservation. Votre service est confirmé.`
        : `🎉 Great news! ${welper} has accepted your booking. Your service is confirmed.`;

    case "customer_booking_declined":
      return fr
        ? `Votre Welper n'est malheureusement plus disponible. Choisissez un autre Welper ou publiez votre demande afin de recevoir de nouvelles candidatures.`
        : `Unfortunately, your Welper is no longer available. Choose another Welper or post your request to receive new applications.`;

    case "customer_job_application":
      return fr
        ? `🎉 Bonne nouvelle! Un Welper a postulé à votre demande. Consultez son profil et choisissez la personne qui vous convient sur Welpco.`
        : `🎉 Good news! A Welper has applied to your request. Review their profile and choose the one that's right for you on Welpco.`;

    case "customer_booking_checked_in":
      return fr
        ? `Votre Welper vient de commencer le service. Vous pourrez laisser une évaluation une fois celui-ci terminé.`
        : `Your Welper has started the service. You'll be able to leave a review once it's completed.`;

    case "customer_booking_cancelled":
      return fr
        ? `Votre réservation a été annulée. Consultez votre compte Welpco pour plus de détails.`
        : `Your booking has been cancelled. Please check your Welpco account for more information.`;

    case "welper_booking_request":
      return fr
        ? `🚨 Nouvelle réservation! Un client souhaite réserver vos services. Acceptez ou refusez rapidement afin de ne pas manquer cette opportunité.`
        : `🚨 New booking request! A customer wants to book your services. Accept or decline quickly so you don't miss this opportunity.`;

    case "welper_payment_processing":
      return fr
        ? `💳 Votre service est confirmé. Votre paiement est maintenant en cours de traitement.`
        : `💳 Your completed service has been confirmed. Your payment is now being processed.`;

    case "welper_payment_sent":
      return fr
        ? `Excellente nouvelle! Votre paiement a été envoyé à votre compte Stripe. Vous pouvez maintenant transférer les fonds vers votre compte bancaire. Le dépôt sera effectué selon les délais de traitement de votre institution financière.`
        : `Great news! Your payment has been sent to your Stripe account. You can now transfer your payment into your bank account and it will be deposited according to your financial institution's processing times.`;

    case "welper_booking_cancelled":
      return fr
        ? `L'une de vos réservations a été annulée. Veuillez consulter votre compte Welpco pour plus de détails.`
        : `One of your bookings have been cancelled. Please check your Welpco account for more information.`;

    case "welper_dispute_opened":
      return fr
        ? `Un litige a été ouvert concernant une de vos réservations. Consultez votre compte pour répondre si nécessaire.`
        : `A dispute has been opened regarding one of your bookings. Please review your account if a response is required.`;

    case "welper_dispute_resolved":
      return fr
        ? `Le litige est maintenant résolu. Consultez votre compte Welpco pour connaître la décision.`
        : `The dispute has been resolved. Please check your Welpco account to view the decision.`;

    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
