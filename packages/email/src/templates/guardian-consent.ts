import { wrapEmail } from "../layout";
import { brandGreen, btnStyle, h1Style, mutedStyle, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface GuardianReviewEmailParams {
  reviewUrl: string;
  guardianName: string;
  minorFirstName: string;
  minorLastName?: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}

export function getGuardianReviewEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr"
    ? "Approbation requise — compte Welper mineur"
    : "Approval needed — minor Welper account";
}

export function getGuardianReviewEmailHtml(params: GuardianReviewEmailParams): string {
  const locale = params.locale ?? "en";
  const minorName = [params.minorFirstName, params.minorLastName].filter(Boolean).join(" ").trim();
  const title = getGuardianReviewEmailSubject(locale);
  const greeting =
    locale === "fr"
      ? `Bonjour ${params.guardianName},`
      : `Hi ${params.guardianName},`;
  const intro =
    locale === "fr"
      ? `${minorName || "Votre enfant"} souhaite créer un compte Welper sur Welpco. Welpco est une plateforme qui met en relation des clients et des jeunes prestataires de services locaux.`
      : `${minorName || "Your child"} wants to create a Welper account on Welpco. Welpco is a platform that connects customers with local service providers.`;
  const body =
    locale === "fr"
      ? "En tant que parent ou tuteur légal, nous avons besoin de votre approbation avant que ce compte puisse être activé. Cliquez ci-dessous pour consulter les détails et approuver la demande."
      : "As their parent or legal guardian, we need your approval before this account can go live. Click below to review the details and approve the request.";
  const cta = locale === "fr" ? "Consulter la demande" : "Review request";
  const linkLabel =
    locale === "fr"
      ? "Ou copiez et collez ce lien dans votre navigateur :"
      : "Or copy and paste this link into your browser:";
  const footer =
    locale === "fr"
      ? "Ce lien expire dans 72 heures. Si vous n'êtes pas le tuteur de cette personne, ignorez ce courriel."
      : "This link expires in 72 hours. If you are not this person's guardian, please ignore this email.";
  const signOff =
    locale === "fr" ? "Merci,<br>L'équipe Welpco" : "Thank you,<br>The Welpco Team";

  const content = [
    `<h1 style="${h1Style}">${locale === "fr" ? "Approbation du compte Welper" : "Welper account approval"}</h1>`,
    `<p style="${pStyle}">${greeting}</p>`,
    `<p style="${pStyle}">${intro}</p>`,
    `<p style="${pStyle}">${body}</p>`,
    `<div style="text-align: center; margin: 28px 0;"><a href="${params.reviewUrl}" style="${btnStyle}">${cta}</a></div>`,
    `<p style="${pStyle}">${linkLabel}</p>`,
    `<p style="word-break: break-all; color: ${brandGreen};">${params.reviewUrl}</p>`,
    `<p style="${mutedStyle}">${footer}</p>`,
    `<p style="${pStyle}">${signOff}</p>`,
  ].join("\n");

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}

export function getGuardianReviewEmailText(params: GuardianReviewEmailParams): string {
  const locale = params.locale ?? "en";
  const minorName = [params.minorFirstName, params.minorLastName].filter(Boolean).join(" ").trim();
  if (locale === "fr") {
    return [
      `Bonjour ${params.guardianName},`,
      "",
      `${minorName || "Votre enfant"} souhaite créer un compte Welper sur Welpco.`,
      "Consultez et approuvez la demande :",
      params.reviewUrl,
      "",
      "Ce lien expire dans 72 heures.",
      "",
      "Merci,",
      "L'équipe Welpco",
    ].join("\n");
  }
  return [
    `Hi ${params.guardianName},`,
    "",
    `${minorName || "Your child"} wants to create a Welper account on Welpco.`,
    "Review and approve the request:",
    params.reviewUrl,
    "",
    "This link expires in 72 hours.",
    "",
    "Thank you,",
    "The Welpco Team",
  ].join("\n");
}
