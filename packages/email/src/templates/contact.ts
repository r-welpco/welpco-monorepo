import { escapeHtml, wrapEmail } from "../layout";
import { h1Style, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface ContactFormData {
  role: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export function getContactNotificationSubject(data: ContactFormData): string {
  return `[Contact] ${data.role} — ${data.name}`;
}

export function getContactAckSubject(locale: EmailLocale): string {
  return locale === "fr" ? "Nous avons re\u00e7u votre message" : "We received your message";
}

export function getContactNotificationHtml(
  data: ContactFormData,
  locale: EmailLocale = "en",
  publicAppUrl?: string,
): string {
  const phone = data.phone?.trim();
  const content = `
<h1 style="${h1Style}">New contact form submission</h1>
<p style="${pStyle}"><strong>Role:</strong> ${escapeHtml(data.role)}</p>
<p style="${pStyle}"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
<p style="${pStyle}"><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
${phone ? `<p style="${pStyle}"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
<p style="${pStyle}"><strong>Message:</strong></p>
<p style="${pStyle}">${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>`;

  return wrapEmail({
    content,
    locale,
    documentTitle: getContactNotificationSubject(data),
    publicAppUrl,
  });
}

export function getContactAckHtml(
  name: string,
  locale: EmailLocale = "en",
  publicAppUrl?: string,
): string {
  const title = getContactAckSubject(locale);
  const greeting = locale === "fr" ? `Bonjour ${escapeHtml(name)},` : `Hi ${escapeHtml(name)},`;
  const body =
    locale === "fr"
      ? "Merci de nous avoir \u00e9crit. Notre \u00e9quipe a bien re\u00e7u votre message et vous r\u00e9pondra dans les plus brefs d\u00e9lais."
      : "Thanks for reaching out. Our team has received your message and will get back to you as soon as we can.";
  const content = `
<h1 style="${h1Style}">${locale === "fr" ? "Message re\u00e7u" : "Message received"}</h1>
<p style="${pStyle}">${greeting}</p>
<p style="${pStyle}">${body}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl });
}
