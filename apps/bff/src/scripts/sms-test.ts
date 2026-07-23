/**
 * Send a one-off test SMS using a transactional template type.
 *
 * Usage:
 *   pnpm --filter @welpco/bff sms:test -- --to +15145551234 --type welper_booking_request
 *   pnpm --filter @welpco/bff sms:test -- --to +15145551234 --type customer_booking_accepted --locale fr --welper-name "Alex"
 *
 * Loads TWILIO_* / SMS_PROVIDER from apps/bff/.env then .env.local.
 * With stub (default when Twilio is unset), body is logged only — no real send.
 */
import { config } from 'dotenv';
import { join } from 'path';
import {
  getSmsBody,
  resolveTwilioConfig,
  sendSms,
  SMS_TEMPLATE_TYPES,
  type SmsLocale,
  type SmsTemplateType,
} from '@welpco/sms';

config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../../.env.local') });

function printUsage(): void {
  console.log(`Send a test SMS for a Welpco template type.

Usage:
  pnpm --filter @welpco/bff sms:test -- --to <E.164> --type <template>
  pnpm --filter @welpco/bff sms:test -- --to <E.164> --type <template> --locale fr --welper-name "Alex"

Options:
  --to             Recipient phone in E.164 (e.g. +15145551234) [required]
  --type           SMS template id [required]
  --locale         en | fr (default: en)
  --welper-name    Optional name interpolated into some customer templates
  --dry-run        Print body and resolved provider; do not send
  -h, --help       Show this help

Template types:
${SMS_TEMPLATE_TYPES.map((t) => `  • ${t}`).join('\n')}
`);
}

function argValue(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx < 0) return undefined;
  return args[idx + 1];
}

function isSmsTemplateType(value: string): value is SmsTemplateType {
  return (SMS_TEMPLATE_TYPES as readonly string[]).includes(value);
}

function isSmsLocale(value: string): value is SmsLocale {
  return value === 'en' || value === 'fr';
}

function looksLikeE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const to = argValue(args, '--to')?.trim();
  const typeRaw = argValue(args, '--type')?.trim();
  const localeRaw = (argValue(args, '--locale') ?? 'en').trim().toLowerCase();
  const welperName = argValue(args, '--welper-name')?.trim();
  const dryRun = args.includes('--dry-run');

  if (!to || !typeRaw) {
    console.error('Error: --to and --type are required.\n');
    printUsage();
    process.exit(1);
  }
  if (!looksLikeE164(to)) {
    console.error(`Error: --to must be E.164 (e.g. +15145551234). Got: ${to}`);
    process.exit(1);
  }
  if (!isSmsTemplateType(typeRaw)) {
    console.error(`Error: unknown --type "${typeRaw}".`);
    console.error(`Valid types:\n${SMS_TEMPLATE_TYPES.map((t) => `  • ${t}`).join('\n')}`);
    process.exit(1);
  }
  if (!isSmsLocale(localeRaw)) {
    console.error('Error: --locale must be en or fr.');
    process.exit(1);
  }

  const body = getSmsBody(typeRaw, localeRaw, {
    welperName: welperName || undefined,
  });
  const twilio = resolveTwilioConfig();

  console.log('— SMS test —');
  console.log(`  to:       ${to}`);
  console.log(`  type:     ${typeRaw}`);
  console.log(`  locale:   ${localeRaw}`);
  console.log(`  provider: ${twilio.provider}`);
  console.log(`  from:     ${twilio.fromNumber || '(none)'}`);
  console.log(`  body:     ${body}`);

  if (dryRun) {
    console.log('\nDry run — not sent.');
    return;
  }

  const result = await sendSms({ to, body });
  console.log(`\nSent via ${result.provider}: sid=${result.sid} status=${result.status}`);
}

main().catch((err) => {
  console.error('SMS test failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
