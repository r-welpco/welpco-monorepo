import { wrapEmail } from "../layout";
import { brandGreen, btnStyle, codeBoxStyle, codeStyle, h1Style, mutedStyle, pStyle } from "../styles";
import type { EmailLocale } from "../types";

export interface VerificationEmailParams {
  code: string;
  verificationUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}

export interface PasswordResetEmailParams {
  resetUrl: string;
  locale?: EmailLocale;
  publicAppUrl?: string;
}

export function getVerificationEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr"
    ? "V\u00e9rifiez votre adresse courriel Welpco"
    : "Verify Your Welpco Email Address";
}

export function getPasswordResetEmailSubject(locale: EmailLocale = "en"): string {
  return locale === "fr" ? "R\u00e9initialisez votre mot de passe Welpco" : "Reset Your Welpco Password";
}

export function getVerificationEmailHtml(params: VerificationEmailParams): string {
  const locale = params.locale ?? "en";
  const title = getVerificationEmailSubject(locale);
  const intro =
    locale === "fr"
      ? "Merci de vous \u00eatre inscrit sur Welpco\u00a0! Veuillez v\u00e9rifier votre adresse courriel \u00e0 l\u2019aide du code ci-dessous\u00a0:"
      : "Thank you for signing up for Welpco! Please verify your email address using the code below:";
  const cta =
    locale === "fr" ? "Aller \u00e0 la page de v\u00e9rification" : "Go to Verification Page";
  const footer =
    locale === "fr"
      ? "Ce code de v\u00e9rification expirera dans 24 heures. Si vous n\u2019avez pas cr\u00e9\u00e9 de compte, veuillez ignorer ce courriel."
      : "This verification code will expire in 24 hours. If you didn't create an account, please ignore this email.";

  const content = [
    `<h1 style="${h1Style}">${locale === "fr" ? "V\u00e9rifiez votre adresse courriel" : "Verify Your Email Address"}</h1>`,
    `<p style="${pStyle}">${intro}</p>`,
    `<div style="text-align: center; margin: 30px 0;">`,
    `<div style="${codeBoxStyle}"><div style="${codeStyle}">${params.code}</div></div>`,
    `<p style="text-align: center; margin-top: 20px;"><a href="${params.verificationUrl}" style="${btnStyle}">${cta}</a></p>`,
    `<p style="${mutedStyle}">${footer}</p>`,
  ].join("\n");

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}

export function getPasswordResetEmailHtml(params: PasswordResetEmailParams): string {
  const locale = params.locale ?? "en";
  const title = getPasswordResetEmailSubject(locale);
  const intro =
    locale === "fr"
      ? "Vous avez demand\u00e9 la r\u00e9initialisation du mot de passe de votre compte Welpco. Cliquez sur le bouton ci-dessous pour continuer\u00a0:"
      : "You requested to reset your password for your Welpco account. Click the button below to reset it:";
  const cta = locale === "fr" ? "R\u00e9initialiser le mot de passe" : "Reset Password";
  const linkLabel =
    locale === "fr"
      ? "Ou copiez et collez ce lien dans votre navigateur\u00a0:"
      : "Or copy and paste this link into your browser:";
  const footer =
    locale === "fr"
      ? "Ce lien expirera dans 15 minutes. Si vous n\u2019avez pas demand\u00e9 de r\u00e9initialisation, veuillez ignorer ce courriel."
      : "This password reset link will expire in 15 minutes. If you didn't request a password reset, please ignore this email.";

  const content = [
    `<h1 style="${h1Style}">${locale === "fr" ? "R\u00e9initialisez votre mot de passe" : "Reset Your Password"}</h1>`,
    `<p style="${pStyle}">${intro}</p>`,
    `<div style="text-align: center; margin: 30px 0;"><a href="${params.resetUrl}" style="${btnStyle}">${cta}</a></div>`,
    `<p style="${pStyle}">${linkLabel}</p>`,
    `<p style="word-break: break-all; color: ${brandGreen};">${params.resetUrl}</p>`,
    `<p style="${mutedStyle}">${footer}</p>`,
  ].join("\n");

  return wrapEmail({ content, locale, documentTitle: title, publicAppUrl: params.publicAppUrl });
}
