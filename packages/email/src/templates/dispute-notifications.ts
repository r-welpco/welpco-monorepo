import { escapeHtml, wrapEmail } from "../layout";
import { btnStyle, h1Style, mutedStyle, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export type DisputeEmailType =
  | "dispute_filed"
  | "dispute_resolved"
  | "dispute_withdrawn"
  | "refund_decision_recorded";

export interface DisputeEmailVariables {
  subject?: string;
  disputeUrl?: string;
  resolutionSummary?: string;
  firstName?: string;
}

export type DisputeNotificationCopy = {
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

export function getDisputeEmailSubject(type: DisputeEmailType, locale: EmailLocale = "en"): string {
  const fr = isFr(locale);
  switch (type) {
    case "dispute_filed":
      return fr ? "Nouveau signalement de problème" : "New problem report";
    case "dispute_resolved":
      return fr ? "Signalement résolu" : "Problem report resolved";
    case "dispute_withdrawn":
      return fr ? "Signalement retiré" : "Problem report withdrawn";
    case "refund_decision_recorded":
      return fr ? "Décision de remboursement enregistrée" : "Refund decision recorded";
    default:
      return fr ? "Mise à jour de signalement" : "Problem report update";
  }
}

export function getDisputeNotificationCopy(
  type: DisputeEmailType,
  locale: EmailLocale = "en",
  variables: DisputeEmailVariables = {},
): DisputeNotificationCopy {
  const fr = isFr(locale);
  const subject = variables.subject?.trim() || (fr ? "une réservation récente" : "a recent booking");

  switch (type) {
    case "dispute_filed":
      return {
        title: fr ? "Nouveau signalement de problème" : "New problem report",
        body: fr
          ? `Un signalement de problème a été déposé concernant ${subject}. Ouvrez-le pour voir les détails et répondre.`
          : `A problem report was filed about ${subject}. Open it to see details and respond.`,
      };
    case "dispute_resolved":
      return {
        title: fr ? "Signalement résolu" : "Problem report resolved",
        body:
          variables.resolutionSummary?.trim() ||
          (fr
            ? "Un signalement de problème a été résolu. Consultez les détails pour la suite."
            : "A problem report has been resolved. Check the details for next steps."),
      };
    case "dispute_withdrawn":
      return {
        title: fr ? "Signalement retiré" : "Problem report withdrawn",
        body: fr
          ? `Le signalement de problème concernant ${subject} a été retiré.`
          : `The problem report about ${subject} was withdrawn.`,
      };
    case "refund_decision_recorded":
      return {
        title: fr ? "Décision de remboursement enregistrée" : "Refund decision recorded",
        body: fr
          ? "Welpco a enregistré une décision de remboursement. Le signalement restera ouvert jusqu\u2019à la confirmation du remboursement."
          : "Welpco recorded a refund decision. The report will remain open until the refund is confirmed.",
      };
    default:
      return {
        title: fr ? "Mise à jour de signalement" : "Problem report update",
        body: fr ? "Vous avez une mise à jour de signalement." : "You have a problem report update.",
      };
  }
}

export function getDisputeResolutionSummary(
  locale: EmailLocale,
  resolutionType: string,
  refundStatus: string,
): string {
  const fr = isFr(locale);
  if (resolutionType === "refund" || resolutionType === "partial_refund") {
    if (refundStatus === "succeeded") {
      return resolutionType === "partial_refund"
        ? fr
          ? "Un remboursement partiel a été émis pour votre réservation. Il peut prendre quelques jours ouvrables avant d\u2019apparaître sur votre relevé."
          : "A partial refund has been issued for your booking. It can take a few business days to appear on your statement."
        : fr
          ? "Un remboursement a été émis pour votre réservation. Il peut prendre quelques jours ouvrables avant d\u2019apparaître sur votre relevé."
          : "A refund has been issued for your booking. It can take a few business days to appear on your statement.";
    }
    if (refundStatus === "failed") {
      return fr
        ? "Le signalement a été résolu, mais le remboursement n\u2019a pas pu être traité automatiquement. Ouvrez le signalement pour les détails et les prochaines étapes."
        : "The dispute was resolved, but the refund could not be processed automatically. Open the dispute for details and next steps.";
    }
    return fr
      ? "Le signalement a été résolu. Ouvrez-le pour consulter le résultat."
      : "The dispute has been resolved. Open it to review the outcome.";
  }
  return fr
    ? "Le signalement a été résolu. Ouvrez-le pour consulter le résultat."
    : "The dispute has been resolved. Open it to review the outcome.";
}

export function getDisputeEmailHtml(params: {
  type: DisputeEmailType;
  variables: DisputeEmailVariables;
  locale?: EmailLocale;
  publicAppUrl?: string;
}): string {
  const locale = params.locale ?? "en";
  const fr = isFr(locale);
  const type = params.type;
  const v = params.variables;
  const title = getDisputeEmailSubject(type, locale);
  const disputeUrl = v.disputeUrl ?? "#";
  const openDispute = fr ? "Ouvrir le signalement" : "Open problem report";
  const subjectLabel = escapeHtml(
    v.subject?.trim() || (fr ? "une réservation récente" : "a recent booking"),
  );

  let content: string;
  switch (type) {
    case "dispute_filed":
      content = `
<h1 style="${h1Style}">${fr ? "Nouveau signalement de problème" : "New problem report"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Un signalement de problème a été déposé concernant ${subjectLabel}.`
        : `A problem report was filed about ${subjectLabel}.`}</p>
<p style="${pStyle}">${fr
        ? "Connectez-vous à votre compte pour consulter les détails et y répondre."
        : "Log into your account to review the details and respond."}</p>
<p style="margin-top: 20px;"><a href="${disputeUrl}" style="${btnStyle}">${openDispute}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    case "dispute_resolved": {
      const summary = escapeHtml(
        v.resolutionSummary?.trim() ||
          (fr
            ? "Un signalement de problème a été résolu."
            : "A problem report has been resolved."),
      );
      content = `
<h1 style="${h1Style}">${fr ? "Signalement résolu" : "Problem report resolved"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${summary}</p>
<p style="${pStyle}">${fr
        ? "Ouvrez le signalement pour consulter le résultat et les prochaines étapes."
        : "Open the report to review the outcome and any next steps."}</p>
<p style="margin-top: 20px;"><a href="${disputeUrl}" style="${btnStyle}">${openDispute}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    }
    case "dispute_withdrawn":
      content = `
<h1 style="${h1Style}">${fr ? "Signalement retiré" : "Problem report withdrawn"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? `Le signalement de problème concernant ${subjectLabel} a été retiré.`
        : `The problem report about ${subjectLabel} was withdrawn.`}</p>
<p style="${pStyle}">${fr
        ? "Aucune autre action n\u2019est requise de votre part pour ce signalement."
        : "No further action is required from you for this report."}</p>
<p style="margin-top: 20px;"><a href="${disputeUrl}" style="${btnStyle}">${openDispute}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    case "refund_decision_recorded":
      content = `
<h1 style="${h1Style}">${fr ? "Décision de remboursement enregistrée" : "Refund decision recorded"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr
        ? "Welpco a enregistré une décision de remboursement pour votre signalement."
        : "Welpco recorded a refund decision for your problem report."}</p>
<p style="${pStyle}">${fr
        ? "Le signalement restera ouvert jusqu\u2019à la confirmation du remboursement. Vous pouvez consulter les détails dans votre compte."
        : "The report will remain open until the refund is confirmed. You can review the details in your account."}</p>
<p style="margin-top: 20px;"><a href="${disputeUrl}" style="${btnStyle}">${openDispute}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
      break;
    default:
      content = `
<h1 style="${h1Style}">${fr ? "Mise à jour de signalement" : "Problem report update"}</h1>
<p style="${pStyle}">${greeting(v.firstName, locale)}</p>
<p style="${pStyle}">${fr ? "Vous avez une mise à jour de signalement." : "You have a problem report update."}</p>
<p style="margin-top: 20px;"><a href="${disputeUrl}" style="${btnStyle}">${openDispute}</a></p>
<p style="${mutedStyle}">${thanks(locale)}</p>`;
  }

  return wrapEmail({
    content,
    locale,
    documentTitle: title,
    publicAppUrl: params.publicAppUrl,
  });
}
