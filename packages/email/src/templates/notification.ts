import { escapeHtml, wrapEmail } from "../layout";
import { btnStyle, h1Style, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface NotificationEmailParams {
  title: string;
  body: string;
  actionUrl?: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}

export function getNotificationEmailSubject(title: string): string {
  const trimmed = title.trim();
  return trimmed.includes("Welpco") ? trimmed : `${trimmed} – Welpco`;
}

export function getNotificationEmailHtml(params: NotificationEmailParams): string {
  const locale = params.locale ?? "en";
  const fr = locale === "fr";
  const title = escapeHtml(params.title.trim() || (fr ? "Notification" : "Notification"));
  const body = escapeHtml(params.body.trim());
  const actionUrl = params.actionUrl?.trim();
  const cta = fr ? "Ouvrir dans Welpco" : "Open in Welpco";
  const documentTitle = getNotificationEmailSubject(params.title);

  const content = `
<h1 style="${h1Style}">${title}</h1>
<p style="${pStyle}">${body}</p>
${actionUrl ? `<p style="margin-top: 20px;"><a href="${escapeHtml(actionUrl)}" style="${btnStyle}">${cta}</a></p>` : ""}`;

  return wrapEmail({
    content,
    locale,
    documentTitle,
    publicAppUrl: params.publicAppUrl,
  });
}
