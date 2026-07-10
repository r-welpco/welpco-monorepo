# @welpco/email

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Welpco-branded email templates plus a dual transport: **Resend HTTP API** when `RESEND_API_KEY` is set, otherwise **nodemailer SMTP** (defaulting to MailHog on `localhost:1025` in dev). Actively consumed by the BFF and the web app.

| | |
|---|---|
| Package name | `@welpco/email` |
| Location | `packages/email/` |
| Entry point | `./dist/index.js` (built with `tsc`; scripts: `build`, `type-check`, `smoke:mailhog`) |
| Consumers | `apps/bff` (notification, booking, payment, dispute, user-management/email services) and `apps/web` (`app/api/contact/route.ts`) |

## Transport — how mail is actually sent (`src/transport.ts`, `src/resend.ts`)

`sendMail(options, transport?, config?)` is the single entry point:

1. If a Resend API key is resolvable (`config.resendApiKey` → `RESEND_API_KEY` env), delivery goes through `sendMailViaResend()` using the official `resend` SDK. Comment in source: preferred on Vercel because SMTP ports are blocked there.
2. Otherwise it falls back to `createSmtpTransport()` (nodemailer): `SMTP_HOST` (default `localhost`), `SMTP_PORT` (default **1025** = MailHog), optional `SMTP_USER`/`SMTP_PASS`, `secure` only on port 465. Default from: `SMTP_FROM` → `noreply@welpco.com`.

The BFF wires this in `apps/bff/src/domains/user-management/email/email.service.ts`: it builds an `SmtpConfig` from Nest `ConfigService` and picks `deliveryMode = hasResendApiKey(...) ? 'resend' : 'smtp'`. So: **Resend in production/Vercel, MailHog via SMTP in local dev** — both paths live in this package, and the BFF just calls `sendMail`.

`scripts/smoke-mailhog.ts` (`pnpm --filter @welpco/email smoke:mailhog`) sends the branded templates to MailHog for visual smoke-testing.

## Templates (`src/templates/`)

All templates are `getXxxSubject()` / `getXxxHtml()` (some with `...Text()`) functions, bilingual (`EmailLocale = "en" | "fr"`), wrapped in a shared branded layout:

| File | Covers |
|---|---|
| `auth.ts` | Email verification, password reset |
| `booking.ts` | Booking lifecycle notifications + welcome email |
| `payment-notifications.ts` | Payment event emails |
| `dispute-notifications.ts` | Dispute lifecycle emails + resolution summary |
| `notification.ts` | Generic notification email |
| `background-check.ts` | Background-check invite |
| `guardian-consent.ts` | Minor guardian review/consent |
| `contact.ts` | Contact-form notification + acknowledgement (used by `apps/web/app/api/contact/route.ts`) |
| `prelaunch.ts` | Prelaunch/launch-day announcements |

Supporting modules: `src/layout.ts` (branded HTML wrapper, footer copy, `resolvePublicAppUrl()`), `src/styles.ts` (brand color constants), `src/types.ts` (`Segment`, `EmailLocale`, `WrapEmailOptions`).

## Usage

```ts
import { sendMail, getVerificationEmailSubject, getVerificationEmailHtml } from '@welpco/email';

await sendMail({
  to: user.email,
  subject: getVerificationEmailSubject('en'),
  html: getVerificationEmailHtml({ /* VerificationEmailParams */ }),
}); // Resend if RESEND_API_KEY set, else SMTP/MailHog
```

Note: the BFF's `prebuild` script builds this package (`pnpm --filter @welpco/email ... run build`) before `nest build`, and `apps/bff/webpack.config.js` references it too.
