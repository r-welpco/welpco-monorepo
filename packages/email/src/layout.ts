import {
  bgBody,
  bgCard,
  borderLight,
  brandGreen,
  textMuted,
  textPrimary,
} from "./styles";
import type { EmailLocale, WrapEmailOptions } from "./types";

const footerCopy: Record<EmailLocale, { questions: string; rights: string }> = {
  en: {
    questions: "Questions? Contact us at",
    rights: "&copy; Welpco. All rights reserved.",
  },
  fr: {
    questions: "Des questions\u00a0? Contactez-nous \u00e0",
    rights: "&copy; Welpco. Tous droits r\u00e9serv\u00e9s.",
  },
};

export function resolvePublicAppUrl(explicit?: string): string {
  const raw = explicit ?? process.env.PUBLIC_APP_URL ?? "";
  return raw.replace(/\/$/, "");
}

export function getLogoHtml(publicAppUrl?: string): string {
  const baseUrl = resolvePublicAppUrl(publicAppUrl);
  const logoUrl = baseUrl ? `${baseUrl}/logos/logo-green.png` : "";
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="Welpco" width="140" border="0" style="display:block; max-width:140px; height:auto; outline:none; text-decoration:none;" />`;
  }
  return `<span style="font-size:1.5rem; font-weight:700; color:${brandGreen};">Welpco</span>`;
}

export function wrapEmail(options: WrapEmailOptions): string {
  const { content, locale, documentTitle, publicAppUrl } = options;
  const logoHtml = getLogoHtml(publicAppUrl);
  const footer = footerCopy[locale];

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:${bgBody}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textPrimary};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgBody};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color:${bgCard}; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid ${borderLight};">
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 3px solid ${brandGreen};">
              ${logoHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid ${borderLight}; background-color: #fafbf9;">
              <p style="margin:0; font-size: 13px; color: ${textMuted};">
                ${footer.questions} <a href="mailto:support@welpco.com" style="color:${brandGreen}; text-decoration:none;">support@welpco.com</a>
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: ${textMuted};">
                ${footer.rights}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
