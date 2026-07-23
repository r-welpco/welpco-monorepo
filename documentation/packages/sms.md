# @welpco/sms

Welpco SMS transport: **Twilio Programmable Messaging** when credentials are configured, otherwise a **stub** that logs to the console (local/dev equivalent of Mailpit for email).

| | |
|---|---|
| Package name | `@welpco/sms` |
| Location | `packages/sms/` |
| Entry point | `./dist/index.js` (built with `tsc`) |
| Consumers | `apps/bff` (`SmsService`, `SmsNotificationService`) |

## Transport

`sendSms(options, config?)`:

1. If `SMS_PROVIDER=stub` **or** Twilio creds are missing → `sendSmsViaStub` (logs `[sms:stub] …`).
2. Otherwise → `sendSmsViaTwilio` via the official `twilio` SDK.

Helpers:

- `toE164({ countryCode, number })` — profile phone jsonb → E.164
- `hasTwilioCredentials` / `resolveTwilioConfig`
- `getSmsBody(type, locale, vars?)` — EN/FR transactional copy for booking, job, payment, and dispute events

## Transactional templates

| Recipient | Event | Template type |
|---|---|---|
| Customer | Booking request sent | `customer_booking_request_sent` |
| Customer | Booking accepted | `customer_booking_accepted` |
| Customer | Booking declined | `customer_booking_declined` |
| Customer | Job application | `customer_job_application` |
| Customer | Checked in | `customer_booking_checked_in` |
| Customer | Cancelled (welper cancelled) | `customer_booking_cancelled` |
| Welper | New booking request | `welper_booking_request` |
| Welper | Payment processing | `welper_payment_processing` |
| Welper | Payment sent | `welper_payment_sent` |
| Welper | Cancelled (customer cancelled) | `welper_booking_cancelled` |
| Welper | Dispute opened | `welper_dispute_opened` |
| Welper | Dispute resolved | `welper_dispute_resolved` |

BFF wires these via `smsBody` on `NotificationService.send` / `emitForUser`. Cancellation SMS goes only to the other party (participant cancel already notifies the counterparty only).

## Env

| Variable | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` | Account SID |
| `TWILIO_AUTH_TOKEN` | Auth token |
| `TWILIO_FROM_NUMBER` | E.164 sender number |
| `SMS_PROVIDER` | `twilio` \| `stub` |

## Usage

```ts
import { sendSms, toE164 } from "@welpco/sms";

const to = toE164(profile.phoneNumber);
if (to) {
  await sendSms({ to, body: "Your booking was confirmed." });
}
```

BFF wraps this in `SmsService` / `SmsNotificationService`. Sends are gated by `notification_preferences.sms_enabled` (default **true**, user opt-out).
