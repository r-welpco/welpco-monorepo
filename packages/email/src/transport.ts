import nodemailer, { type Transporter } from "nodemailer";

export interface SmtpConfig {
  host?: string;
  port?: number;
  from?: string;
  user?: string;
  pass?: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

function readSmtpPass(config?: SmtpConfig): string | undefined {
  if (config?.pass) return config.pass;
  return process.env.SMTP_PASS || process.env.SMTP_PASSWORD || undefined;
}

export function createSmtpTransport(config?: SmtpConfig): Transporter {
  const host = config?.host ?? process.env.SMTP_HOST ?? "localhost";
  const port = config?.port ?? (Number(process.env.SMTP_PORT) || 1025);
  const user = config?.user ?? process.env.SMTP_USER;
  const pass = readSmtpPass(config);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendMail(
  options: SendMailOptions,
  transport?: Transporter,
  config?: SmtpConfig,
): Promise<void> {
  const tx = transport ?? createSmtpTransport(config);
  const from =
    options.from ??
    config?.from ??
    process.env.SMTP_FROM ??
    "noreply@welpco.com";

  await tx.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text ?? options.html.replace(/<[^>]*>/g, ""),
  });
}
