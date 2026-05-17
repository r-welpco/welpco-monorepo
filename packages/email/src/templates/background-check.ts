import { wrapEmail } from "../layout";
import { btnStyle, h1Style, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface BackgroundCheckInviteEmailParams {
  applicantUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
  firstName?: string;
}

export function getBackgroundCheckInviteEmailSubject(
  locale: EmailLocale = "en",
): string {
  return locale === "fr"
    ? "Compl\u00e9tez votre v\u00e9rification des ant\u00e9c\u00e9dents"
    : "Complete Your Background Check";
}

function displayName(firstName?: string): string {
  const trimmed = firstName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Welper";
}

export function getBackgroundCheckInviteEmailText(
  params: BackgroundCheckInviteEmailParams,
): string {
  const locale = params.locale ?? "en";
  const name = displayName(params.firstName);

  if (locale === "fr") {
    return [
      `Bonjour ${name},`,
      "",
      "Merci d\u2019avoir compl\u00e9t\u00e9 votre profil ! Nous sommes ravis de vous accueillir dans la communaut\u00e9 Welpco.",
      "",
      "Pour finaliser votre inscription, veuillez compl\u00e9ter votre v\u00e9rification des ant\u00e9c\u00e9dents en utilisant le lien ci-dessous. Votre paiement a d\u00e9j\u00e0 \u00e9t\u00e9 trait\u00e9 :",
      "",
      params.applicantUrl,
      "",
      "Une fois les r\u00e9sultats re\u00e7us (g\u00e9n\u00e9ralement dans un d\u00e9lai de 48 heures), nous les examinerons et mettrons votre profil \u00e0 jour en cons\u00e9quence.",
      "",
      "Si votre v\u00e9rification est approuv\u00e9e, vous recevrez un badge Certifi\u00e9 sur votre profil. Si elle n\u2019est pas approuv\u00e9e, votre profil demeurera actif en tant que Welper; cependant, le badge Certifi\u00e9 ne sera pas ajout\u00e9.",
      "",
      "Merci,",
      "L\u2019\u00e9quipe Welpco",
    ].join("\n");
  }

  return [
    `Hi ${name},`,
    "",
    "Thank you for completing your profile! We're excited to have you join the Welpco community.",
    "",
    "To finalize your onboarding, please complete your background check using the link below. Your payment has already been processed:",
    "",
    params.applicantUrl,
    "",
    "Once we receive the results (typically within 48 hours), we'll review them and update your profile accordingly.",
    "",
    "If your background check is approved, you'll receive a Certified badge on your profile. If it is not approved, your profile will remain active as a Welper; however, the Certified badge will not be added.",
    "",
    "Thank you,",
    "The Welpco Team",
  ].join("\n");
}

export function getBackgroundCheckInviteEmailHtml(
  params: BackgroundCheckInviteEmailParams,
): string {
  const locale = params.locale ?? "en";
  const title = getBackgroundCheckInviteEmailSubject(locale);
  const name = displayName(params.firstName);

  const cta =
    locale === "fr"
      ? "Compl\u00e9ter la v\u00e9rification des ant\u00e9c\u00e9dents"
      : "Complete your background check";

  const paragraphs =
    locale === "fr"
      ? [
          `Bonjour ${name},`,
          "Merci d\u2019avoir compl\u00e9t\u00e9 votre profil ! Nous sommes ravis de vous accueillir dans la communaut\u00e9 Welpco.",
          "Pour finaliser votre inscription, veuillez compl\u00e9ter votre v\u00e9rification des ant\u00e9c\u00e9dents en utilisant le lien ci-dessous. Votre paiement a d\u00e9j\u00e0 \u00e9t\u00e9 trait\u00e9 :",
          "Une fois les r\u00e9sultats re\u00e7us (g\u00e9n\u00e9ralement dans un d\u00e9lai de 48 heures), nous les examinerons et mettrons votre profil \u00e0 jour en cons\u00e9quence.",
          "Si votre v\u00e9rification est approuv\u00e9e, vous recevrez un badge Certifi\u00e9 sur votre profil. Si elle n\u2019est pas approuv\u00e9e, votre profil demeurera actif en tant que Welper; cependant, le badge Certifi\u00e9 ne sera pas ajout\u00e9.",
          "Merci,<br>L\u2019\u00e9quipe Welpco",
        ]
      : [
          `Hi ${name},`,
          "Thank you for completing your profile! We\u2019re excited to have you join the Welpco community.",
          "To finalize your onboarding, please complete your background check using the link below. Your payment has already been processed:",
          "Once we receive the results (typically within 48 hours), we\u2019ll review them and update your profile accordingly.",
          "If your background check is approved, you\u2019ll receive a Certified badge on your profile. If it is not approved, your profile will remain active as a Welper; however, the Certified badge will not be added.",
          "Thank you,<br>The Welpco Team",
        ];

  const content = [
    `<h1 style="${h1Style}">${title}</h1>`,
    ...paragraphs.slice(0, 3).map((p) => `<p style="${pStyle}">${p}</p>`),
    `<div style="text-align: center; margin: 28px 0;"><a href="${params.applicantUrl}" style="${btnStyle}">${cta}</a></div>`,
    `<p style="${pStyle}"><a href="${params.applicantUrl}" style="word-break: break-all;">${params.applicantUrl}</a></p>`,
    ...paragraphs.slice(3).map((p) => `<p style="${pStyle}">${p}</p>`),
  ].join("\n");

  return wrapEmail({
    content,
    locale,
    documentTitle: title,
    publicAppUrl: params.publicAppUrl,
  });
}
