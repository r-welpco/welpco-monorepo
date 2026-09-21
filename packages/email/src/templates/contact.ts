import { escapeHtml, wrapEmail } from "../layout";
import { h1Style, mutedStyle, pStyle } from "../styles";
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
  return locale === "fr" ? "Nous avons reçu votre message" : "We received your message";
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
<p style="${pStyle}">${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>
<p style="${mutedStyle}">Welpco contact inbox</p>`;

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
  const greeting = locale === "fr" ? `Bonjour ${escapeHtml(name)},` : `Hello ${escapeHtml(name)},`;
  const body =
    locale === "fr"
      ? "Merci de nous avoir écrit. Notre équipe a bien reçu votre message et vous répondra dans les plus brefs délais."
      : "Thanks for reaching out. Our team has received your message and will get back to you as soon as we can.";
  const thanks =
    locale === "fr" ? "Merci,<br>L\u2019équipe Welpco" : "Thank you,<br>The Welpco Team";
  const content = `
<h1 style="${h1Style}">${locale === "fr" ? "Message reçu" : "Message received"}</h1>
<p style="${pStyle}">${greeting}</p>
<p style="${pStyle}">${body}</p>
<p style="${mutedStyle}">${thanks}</p>`;

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl });
}
