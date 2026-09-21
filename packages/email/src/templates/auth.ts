import { escapeHtml, wrapEmail } from "../layout";
import { brandGreen, btnStyle, codeBoxStyle, codeStyle, h1Style, mutedStyle, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface VerificationEmailParams {
  code: string;
  verificationUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
  firstName?: string;
}

export interface PasswordResetEmailParams {
  resetUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
  firstName?: string;
}

function greeting(firstName: string | undefined, locale: EmailLocale): string {
  const safe = firstName?.trim() ? escapeHtml(firstName.trim()) : null;
  if (locale === "fr") {
    return safe ? `Bonjour ${safe},` : "Bonjour,";
  }
  return safe ? `Hello ${safe},` : "Hello,";
}

export function getVerificationEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "Vérifiez votre adresse courriel" : "Verify your email address";
}

export function getPasswordResetEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "Réinitialisez votre mot de passe Welpco" : "Reset your Welpco password";
}

export function getVerificationEmailHtml(params: VerificationEmailParams): string {
  const locale = params.locale ?? "en";
  const fr = locale === "fr";
  const title = getVerificationEmailSubject(locale);
  const intro = fr
    ? "Bienvenue sur Welpco! Veuillez vérifier votre adresse courriel afin de compléter la configuration de votre compte."
    : "Welcome to Welpco! Please verify your email address to complete your account setup.";
  const cta = fr ? "Vérifier mon courriel" : "Verify my email";
  const codeLabel = fr
    ? "Vous pouvez aussi entrer ce code sur la page de vérification\u00a0:"
    : "You can also enter this code on the verification page:";
  const footer = fr
    ? "Ce code de vérification expirera dans 24 heures. Si vous n\u2019avez pas créé de compte, veuillez ignorer ce courriel."
    : "This verification code will expire in 24 hours. If you didn't create an account, please ignore this email.";

  const content = [
    `<h1 style="${h1Style}">${title}</h1>`,
    `<p style="${pStyle}">${greeting(params.firstName, locale)}</p>`,
    `<p style="${pStyle}">${intro}</p>`,
    `<p style="text-align: center; margin: 24px 0;"><a href="${params.verificationUrl}" style="${btnStyle}">${cta}</a></p>`,
    `<p style="${pStyle}">${codeLabel}</p>`,
    `<div style="text-align: center; margin: 20px 0;">`,
    `<div style="${codeBoxStyle}"><div style="${codeStyle}">${params.code}</div></div>`,
    `</div>`,
    `<p style="${mutedStyle}">${footer}</p>`,
  ].join("\n");

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}

export function getPasswordResetEmailHtml(params: PasswordResetEmailParams): string {
  const locale = params.locale ?? "en";
  const fr = locale === "fr";
  const title = getPasswordResetEmailSubject(locale);
  const intro = fr
    ? "Nous avons reçu une demande de réinitialisation de votre mot de passe Welpco."
    : "We received a request to reset your Welpco password.";
  const ctaIntro = fr
    ? "Vous pouvez réinitialiser votre mot de passe en utilisant le lien ci-dessous\u00a0:"
    : "You can reset your password using the link below:";
  const cta = fr ? "Réinitialiser mon mot de passe" : "Reset my password";
  const linkLabel = fr
    ? "Ou copiez et collez ce lien dans votre navigateur\u00a0:"
    : "Or copy and paste this link into your browser:";
  const footer = fr
    ? "Ce lien expirera dans 15 minutes. Si vous n\u2019avez pas demandé ce changement, vous pouvez ignorer ce courriel."
    : "This password reset link will expire in 15 minutes. If you did not request this change, you can ignore this email.";

  const content = [
    `<h1 style="${h1Style}">${title}</h1>`,
    `<p style="${pStyle}">${greeting(params.firstName, locale)}</p>`,
    `<p style="${pStyle}">${intro}</p>`,
    `<p style="${pStyle}">${ctaIntro}</p>`,
    `<div style="text-align: center; margin: 30px 0;"><a href="${params.resetUrl}" style="${btnStyle}">${cta}</a></div>`,
    `<p style="${pStyle}">${linkLabel}</p>`,
    `<p style="word-break: break-all; color: ${brandGreen};">${params.resetUrl}</p>`,
    `<p style="${mutedStyle}">${footer}</p>`,
  ].join("\n");

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}
