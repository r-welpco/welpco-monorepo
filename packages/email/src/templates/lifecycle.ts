import { escapeHtml, wrapEmail } from "../layout";
import { btnStyle, h1Style, mutedStyle, pStyle } from "../styles";
import type { EmailLocale } from "../types";

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

export type JobLifecycleEmailType =
  | "job_published"
  | "job_application_received"
  | "job_application_sent"
  | "job_application_accepted"
  | "job_application_not_selected";

export interface JobLifecycleEmailVariables {
  firstName?: string;
  jobTitle?: string;
  actionUrl?: string;
}

export type JobLifecycleNotificationCopy = {
  title: string;
  body: string;
};

export function getJobLifecycleEmailSubject(
  type: JobLifecycleEmailType,
  locale: EmailLocale = "en",
): string {
  const fr = isFr(locale);
  switch (type) {
    case "job_published":
      return fr ? "Votre demande a été publiée" : "Your request has been published";
    case "job_application_received":
      return fr ? "Vous avez reçu une candidature" : "You have a new application";
    case "job_application_sent":
      return fr ? "Votre candidature a été envoyée!" : "Your application has been sent!";
    case "job_application_accepted":
      return fr
        ? "Félicitations! Votre candidature a été acceptée"
        : "Congratulations! Your application was accepted";
    case "job_application_not_selected":
      return fr ? "Mise à jour concernant votre candidature" : "Update on your application";
    default:
      return fr ? "Mise à jour Welpco" : "Welpco update";
  }
}

export function getJobLifecycleNotificationCopy(
  type: JobLifecycleEmailType,
  locale: EmailLocale = "en",
  variables: JobLifecycleEmailVariables = {},
): JobLifecycleNotificationCopy {
  const fr = isFr(locale);
  const jobTitle = variables.jobTitle?.trim() || (fr ? "votre demande" : "your request");

  switch (type) {
    case "job_published":
      return {
        title: fr ? "Demande publiée" : "Request published",
        body: fr
          ? "Votre demande a bien été publiée sur Welpco. Les Welpers disponibles pourront maintenant la consulter et postuler."
          : "Your request has been successfully published on Welpco. Available Welpers can now view the details and apply.",
      };
    case "job_application_received":
      return {
        title: fr ? "Nouvelle candidature" : "New application",
        body: fr
          ? `Bonne nouvelle! Un Welper a postulé sur votre demande « ${jobTitle} ».`
          : `Good news! A Welper has applied to your request "${jobTitle}".`,
      };
    case "job_application_sent":
      return {
        title: fr ? "Candidature envoyée" : "Application sent",
        body: fr
          ? `Votre candidature pour « ${jobTitle} » a bien été envoyée au client.`
          : `Your application for "${jobTitle}" has successfully been sent to the customer.`,
      };
    case "job_application_accepted":
      return {
        title: fr ? "Candidature acceptée" : "Application accepted",
        body: fr
          ? `Un client vous a sélectionné pour « ${jobTitle} ». Consultez les détails de la réservation.`
          : `A customer has selected you for "${jobTitle}". Review the booking details.`,
      };
    case "job_application_not_selected":
      return {
        title: fr ? "Candidature non retenue" : "Application not selected",
        body: fr
          ? `Le client a sélectionné un autre Welper pour « ${jobTitle} ».`
          : `The customer has selected another Welper for "${jobTitle}".`,
      };
    default:
      return {
        title: fr ? "Mise à jour" : "Update",
        body: fr ? "Vous avez une mise à jour." : "You have an update.",
      };
  }
}

export function getJobLifecycleEmailHtml(params: {
  type: JobLifecycleEmailType;
  variables: JobLifecycleEmailVariables;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const v = params.variables;
  const type = params.type;
  const title = getJobLifecycleEmailSubject(type, locale);
  const actionUrl = v.actionUrl || "#";
  const jobTitle = escapeHtml(v.jobTitle?.trim() || (fr ? "votre demande" : "your request"));

  let content: string;
  switch (type) {
    case "job_published":
      content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Votre demande a bien été publiée sur Welpco."
        : "Your request has been successfully published on Welpco."}</p>
<p style="${pStyle}">${fr
        ? "Les Welpers disponibles pourront maintenant consulter les détails et postuler s\u2019ils sont intéressés."
        : "Available Welpers will now be able to view the details and apply if they are interested."}</p>
<p style="${pStyle}">${fr
        ? "Vous recevrez une notification dès qu\u2019une personne postulera."
        : "You\u2019ll receive a notification as soon as someone applies."}</p>
<p style="margin-top: 20px;"><a href="${actionUrl}" style="${btnStyle}">${fr ? "Voir ma demande" : "View my request"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    case "job_application_received":
      content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Bonne nouvelle! Un Welper a postulé sur votre demande."
        : "Good news! A Welper has applied to your request."}</p>
<p style="${pStyle}">${fr
        ? "Vous pouvez maintenant consulter son profil, ses avis et les informations disponibles afin de décider s\u2019il correspond à ce que vous recherchez."
        : "You can now review their profile, reviews and available information to decide if they are the right fit for your service."}</p>
<p style="margin-top: 20px;"><a href="${actionUrl}" style="${btnStyle}">${fr ? "Voir mes candidatures" : "View my applications"}</a></p>
<p style="${pStyle}">${fr
        ? "Besoin d\u2019aide pour faire votre choix? Répondez simplement à ce courriel."
        : "Need help making your choice? Simply reply to this email."}</p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    case "job_application_sent":
      content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Votre candidature a bien été envoyée au client."
        : "Your application has successfully been sent to the customer."}</p>
<p style="${pStyle}">${fr
        ? "Le client pourra maintenant consulter votre profil et choisir le Welper qu\u2019il souhaite réserver."
        : "The customer will now review your profile and decide which Welper they would like to hire."}</p>
<p style="${pStyle}">${fr
        ? "Nous vous informerons dès qu\u2019il y aura une mise à jour."
        : "We\u2019ll notify you as soon as there\u2019s an update."}</p>
<p style="margin-top: 20px;"><a href="${actionUrl}" style="${btnStyle}">${fr ? "Voir la demande" : "View request"}</a></p>
<p style="${mutedStyle}">${fr ? "Bonne chance!<br>L\u2019équipe Welpco" : "Good luck!<br>The Welpco Team"}</p>`;
      break;
    case "job_application_accepted":
      content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr ? "Bonne nouvelle!" : "Great news!"}</p>
<p style="${pStyle}">${fr
        ? `Un client vous a sélectionné pour sa demande de service « ${jobTitle} ».`
        : `A customer has selected you for their service request "${jobTitle}".`}</p>
<p style="${pStyle}">${fr
        ? "Veuillez vous connecter à votre compte Welpco pour consulter les détails de la réservation et vous préparer pour votre prochain service."
        : "Please log into your Welpco account to review the booking details and prepare for your upcoming service."}</p>
<p style="margin-top: 20px;"><a href="${actionUrl}" style="${btnStyle}">${fr ? "Voir la réservation" : "View booking"}</a></p>
<p style="${mutedStyle}">${fr ? "Bonne chance pour votre service!<br>L\u2019équipe Welpco" : "Good luck on your service!<br>The Welpco Team"}</p>`;
      break;
    case "job_application_not_selected":
      content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Le client a sélectionné un autre Welper pour « ${jobTitle} ».`
        : `The customer has selected another Welper for "${jobTitle}".`}</p>
<p style="${pStyle}">${fr
        ? "Ne vous découragez pas — de nouvelles demandes sont publiées régulièrement sur Welpco."
        : "Don\u2019t worry — new requests are posted regularly on Welpco."}</p>
<p style="${pStyle}">${fr
        ? "Gardez votre profil à jour et continuez à postuler aux opportunités qui vous intéressent."
        : "Keep your profile up to date and continue applying to opportunities that interest you."}</p>
<p style="margin-top: 20px;"><a href="${actionUrl}" style="${btnStyle}">${fr ? "Consulter les annonces" : "Browse requests"}</a></p>
<p style="${mutedStyle}">${fr ? "Bonne chance!<br>L\u2019équipe Welpco" : "Good luck!<br>The Welpco Team"}</p>`;
      break;
    default:
      content = `<p style="${pStyle}">${fr ? "Vous avez une mise à jour." : "You have an update."}</p>`;
  }

  return wrapEmail({
    content,
    locale,
    documentTitle: title,
    publicAppUrl: params.publicAppUrl,
  });
}

/** S5 — Stripe connected */
export function getStripeConnectedEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr"
    ? "Votre compte de paiement est connecté"
    : "Your payout account is connected";
}

export function getStripeConnectedEmailHtml(params: {
  firstName?: string;
  accountUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const title = getStripeConnectedEmailSubject(locale);
  const content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(params.firstName, locale)}</p>
<p style="${pStyle}">${fr
    ? "Votre compte Stripe a bien été connecté à Welpco."
    : "Your Stripe account has been successfully connected to Welpco."}</p>
<p style="${pStyle}">${fr
    ? "Cela signifie que nous pourrons vous envoyer vos paiements pour les services complétés."
    : "This means we\u2019ll be able to send your payouts for completed services."}</p>
<p style="${pStyle}">${fr
    ? "Vous pouvez consulter vos informations de paiement dans votre compte Welpco."
    : "You can view your payout information in your Welpco account."}</p>
<p style="margin-top: 20px;"><a href="${params.accountUrl}" style="${btnStyle}">${fr ? "Voir mon compte" : "View my account"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}

/** S3 — New message */
export function getNewMessageEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "Vous avez reçu un nouveau message" : "You have a new message";
}

export function getNewMessageEmailHtml(params: {
  firstName?: string;
  messagesUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const title = getNewMessageEmailSubject(locale);
  const content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(params.firstName, locale)}</p>
<p style="${pStyle}">${fr
    ? "Vous avez reçu un nouveau message sur Welpco."
    : "You have received a new message on Welpco."}</p>
<p style="${pStyle}">${fr
    ? "Connectez-vous à votre compte pour le consulter et y répondre."
    : "Log into your account to view and reply."}</p>
<p style="margin-top: 20px;"><a href="${params.messagesUrl}" style="${btnStyle}">${fr ? "Ouvrir mes messages" : "Open my messages"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}

/** S6 — Review received (welper) */
export function getReviewReceivedEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "Vous avez reçu un nouvel avis" : "You received a new review";
}

export function getReviewReceivedEmailHtml(params: {
  firstName?: string;
  reviewUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const title = getReviewReceivedEmailSubject(locale);
  const content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(params.firstName, locale)}</p>
<p style="${pStyle}">${fr
    ? "Vous avez reçu un nouvel avis sur Welpco."
    : "You received a new review on Welpco."}</p>
<p style="${pStyle}">${fr
    ? "Les avis aident à bâtir la confiance avec les futurs clients et peuvent vous aider à recevoir plus de réservations."
    : "Reviews help build trust with future customers and can help you receive more bookings."}</p>
<p style="margin-top: 20px;"><a href="${params.reviewUrl}" style="${btnStyle}">${fr ? "Voir mon avis" : "View my review"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}

/** W9.1 — Payout on the way */
export function getPayoutSentEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "Votre paiement est en route" : "Your payment is on its way";
}

export function getPayoutSentEmailHtml(params: {
  firstName?: string;
  accountUrl?: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const title = getPayoutSentEmailSubject(locale);
  const accountUrl = params.accountUrl;
  const content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(params.firstName, locale)}</p>
<p style="${pStyle}">${fr ? "Bonne nouvelle!" : "Good news!"}</p>
<p style="${pStyle}">${fr
    ? "Votre paiement a été traité et est en route vers votre compte bancaire via Stripe."
    : "Your payment has been processed and is on its way to your bank account through Stripe."}</p>
<p style="${pStyle}">${fr
    ? "Selon votre institution financière, un court délai peut être nécessaire avant que le montant apparaisse dans votre compte."
    : "Depending on your financial institution, it may take a short time before the amount appears in your account."}</p>
${accountUrl
  ? `<p style="margin-top: 20px;"><a href="${accountUrl}" style="${btnStyle}">${fr ? "Voir mon compte" : "View my account"}</a></p>`
  : ""}
<p style="${mutedStyle}">${fr
    ? "Merci de faire partie de la communauté Welpco.<br>L\u2019équipe Welpco"
    : "Thank you for being part of the Welpco community.<br>The Welpco Team"}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}

/** Portfolio photo rejected (extra — admin moderation) */
export function getPortfolioRejectedEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr"
    ? "Photo de portfolio non approuvée"
    : "A portfolio photo wasn’t approved";
}

export function getPortfolioRejectedEmailHtml(params: {
  firstName?: string;
  profileUrl: string;
  rejectionReason?: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const title = getPortfolioRejectedEmailSubject(locale);
  const reason = params.rejectionReason?.trim();
  const content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${greeting(params.firstName, locale)}</p>
<p style="${pStyle}">${fr
    ? "Une photo de votre portfolio n\u2019a pas été approuvée."
    : "A photo from your portfolio wasn’t approved."}</p>
${reason
  ? `<p style="${pStyle}"><strong>${fr ? "Raison" : "Reason"}:</strong> ${escapeHtml(reason)}</p>`
  : ""}
<p style="${pStyle}">${fr
    ? "Vous pouvez la remplacer depuis votre profil Welper."
    : "You can replace it from your Welper profile."}</p>
<p style="margin-top: 20px;"><a href="${params.profileUrl}" style="${btnStyle}">${fr ? "Ouvrir mon profil" : "Open my profile"}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}
