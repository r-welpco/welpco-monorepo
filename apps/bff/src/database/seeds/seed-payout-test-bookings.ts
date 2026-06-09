import * as bcrypt from 'bcrypt';
import { DataSource, In } from 'typeorm';
import {
  UserAccount,
  AccountType,
  AccountStatus,
} from '../../domains/user-management/entities/user-account.entity';
import { VerificationStatus } from '../../domains/user-management/entities/verification-status.entity';
import { ReferralCode, CodeType } from '../../domains/user-management/entities/referral-code.entity';
import { CustomerProfile } from '../../domains/profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../../domains/profile-management/entities/welper-profile.entity';
import { ServiceOffering } from '../../domains/profile-management/entities/service-offering.entity';
import { ServiceCategory } from '../../domains/content-management/entities/service-category.entity';
import {
  BookingRequest,
  BookingRequestStatus,
} from '../../domains/booking/entities/booking-request.entity';
import { BookingServiceReceipt } from '../../domains/booking/entities/booking-service-receipt.entity';
import {
  BookingPayment,
  BookingPaymentKind,
  BookingPaymentRecordStatus,
} from '../../domains/payment/entities/booking-payment.entity';
import { WelperPayoutLedger } from '../../domains/payment/entities/welper-payout-ledger.entity';
import { WelperPayoutLedgerStatus } from '../../domains/payment/entities/payout-ledger-status.enum';
import {
  computePlatformGrossCents,
  computeWelperGrossCentsFromCustomerSubtotal,
  customerHourlyChargeFromWelperRate,
} from '../../domains/booking/booking-pricing';
import { PayoutMethodChoice } from '../../domains/profile-management/entities/payout-method-choice.enum';
import { E2E_STRIPE_CONNECT_ACCOUNT_PREFIX } from '../../common/signup-e2e-bypass';
import {
  applySeedCustomerProfileReady,
  applySeedUserAccountFields,
  applySeedWelperProfileReady,
  ensureSeedWelperBackgroundCheckPassed,
} from './seed-user-helpers';
import { pickSeedSubcategory, SEARCH_DEMO_SUBCATEGORY_NAMES } from './seed-category-names';

export const PAYOUT_TEST_WELPER_EMAIL = 'welper_50@welpco.com';
export const PAYOUT_TEST_CUSTOMER_EMAIL = 'customer_50@welpco.com';
export const PAYOUT_TEST_SEED_TAG = 'seed:payout-test-50';
const WELPER_PASSWORD = 'Welper123!';
const CUSTOMER_PASSWORD = 'Customer123!';
const TORONTO_TZ = 'America/Toronto';
const TAX_RATE_BPS = 1300;
const WELPER_HOURLY_RATE = 40;
const JOB_COUNT = 5;

function formatDateToronto(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Last N Saturdays strictly before today (Toronto calendar), oldest first. */
export function getPreviousSaturdayDates(count: number, from = new Date()): string[] {
  const today = formatDateToronto(from);
  const dates: string[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(12, 0, 0, 0);

  for (let scanned = 0; scanned < 400 && dates.length < count; scanned++) {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: TORONTO_TZ,
      weekday: 'short',
    }).format(cursor);
    const iso = formatDateToronto(cursor);
    if (weekday === 'Sat' && iso < today) {
      dates.push(iso);
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return dates.reverse();
}

function torontoDateTime(isoDate: string, time: string): Date {
  const month = parseInt(isoDate.slice(5, 7), 10);
  const offset = month >= 3 && month <= 10 ? '-04:00' : '-05:00';
  return new Date(`${isoDate}T${time}${offset}`);
}

async function ensurePayoutTestUsers(dataSource: DataSource): Promise<{
  customerId: string;
  welperId: string;
  serviceOfferingId: string;
}> {
  const userRepo = dataSource.getRepository(UserAccount);
  const customerProfileRepo = dataSource.getRepository(CustomerProfile);
  const welperProfileRepo = dataSource.getRepository(WelperProfile);
  const offeringRepo = dataSource.getRepository(ServiceOffering);
  const categoryRepo = dataSource.getRepository(ServiceCategory);
  const referralRepo = dataSource.getRepository(ReferralCode);
  const verificationRepo = dataSource.getRepository(VerificationStatus);

  const ensureUser = async (
    email: string,
    accountType: AccountType,
    referralCode: string,
    displayName: { firstName: string; lastName: string },
  ): Promise<UserAccount> => {
    const passwordHash = await bcrypt.hash(
      accountType === AccountType.CUSTOMER ? CUSTOMER_PASSWORD : WELPER_PASSWORD,
      12,
    );
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = userRepo.create({
        email,
        passwordHash,
        accountType,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      });
    } else {
      user.passwordHash = passwordHash;
      user.accountType = accountType;
      user.status = AccountStatus.ACTIVE;
      user.emailVerified = true;
    }
    applySeedUserAccountFields(user, accountType, {
      signupCompleted: true,
      platformAccessEnabled: true,
    });
    user = await userRepo.save(user);

    let verification = await verificationRepo.findOne({ where: { userId: user.id } });
    if (!verification) {
      await verificationRepo.save(
        verificationRepo.create({ userId: user.id, emailVerified: true }),
      );
    }

    const existingReferral = await referralRepo.findOne({ where: { userId: user.id } });
    if (!existingReferral) {
      await referralRepo.save(
        referralRepo.create({
          userId: user.id,
          code: referralCode,
          codeType: CodeType.PERSONAL,
          isActive: true,
        }),
      );
    }

    return user;
  };

  const customerUser = await ensureUser(
    PAYOUT_TEST_CUSTOMER_EMAIL,
    AccountType.CUSTOMER,
    'CUST50TEST',
    { firstName: 'Payout', lastName: 'Customer' },
  );
  let customerProfile = await customerProfileRepo.findOne({
    where: { customerId: customerUser.id },
  });
  if (!customerProfile) {
    customerProfile = customerProfileRepo.create({ customerId: customerUser.id });
  }
  applySeedCustomerProfileReady(customerProfile, { firstName: 'Payout', lastName: 'Customer' });
  await customerProfileRepo.save(customerProfile);

  const welperUser = await ensureUser(
    PAYOUT_TEST_WELPER_EMAIL,
    AccountType.WELPER,
    'WELP50TEST',
    { firstName: 'Payout', lastName: 'Welper' },
  );
  let welperProfile = await welperProfileRepo.findOne({ where: { welperId: welperUser.id } });
  if (!welperProfile) {
    welperProfile = welperProfileRepo.create({ welperId: welperUser.id });
  }
  applySeedWelperProfileReady(welperProfile, { firstName: 'Payout', lastName: 'Welper' });
  welperProfile.payoutMethodChoice = PayoutMethodChoice.STRIPE;
  if (!welperProfile.stripeConnectAccountId) {
    welperProfile.stripeConnectAccountId = `${E2E_STRIPE_CONNECT_ACCOUNT_PREFIX}${welperUser.id}`;
  }
  await welperProfileRepo.save(welperProfile);
  await ensureSeedWelperBackgroundCheckPassed(dataSource, welperUser.id);

  let offering = await offeringRepo.findOne({
    where: { welperId: welperUser.id, active: true },
    order: { createdAt: 'ASC' },
  });
  if (!offering) {
    const categories = await categoryRepo.find({
      where: { name: In([...SEARCH_DEMO_SUBCATEGORY_NAMES]), isActive: true },
    });
    const categoryByName = new Map(categories.map((c) => [c.name, c]));
    const category = pickSeedSubcategory(categoryByName, ['Babysitter'], categories[0]);
    if (!category) {
      throw new Error('No service categories found — run pnpm seed first.');
    }
    offering = offeringRepo.create({
      welperId: welperUser.id,
      serviceCategoryId: category.id,
      serviceDescription: 'Payout test babysitting — seeded for admin payout QA.',
      hourlyRate: WELPER_HOURLY_RATE,
      experienceYears: 5,
      serviceArea: null,
      subcategoryIds: [],
      active: true,
    });
    offering = await offeringRepo.save(offering);
  }

  return {
    customerId: customerUser.id,
    welperId: welperUser.id,
    serviceOfferingId: offering.id,
  };
}

type JobSpec = {
  saturdayIso: string;
  durationMinutes: number;
  startTime: string;
};

/**
 * Inserts 5 completed + payment_released bookings between welper_50 and customer_50
 * on the last 5 Saturdays (Toronto), with receipts, captured payments, and payout ledger rows.
 */
export async function seedPayoutTestBookings(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding payout test bookings (5 Saturdays)...');

  const { customerId, welperId, serviceOfferingId } = await ensurePayoutTestUsers(dataSource);

  const bookingRepo = dataSource.getRepository(BookingRequest);
  const receiptRepo = dataSource.getRepository(BookingServiceReceipt);
  const paymentRepo = dataSource.getRepository(BookingPayment);
  const ledgerRepo = dataSource.getRepository(WelperPayoutLedger);

  const saturdays = getPreviousSaturdayDates(JOB_COUNT);
  if (saturdays.length < JOB_COUNT) {
    throw new Error(`Could not find ${JOB_COUNT} past Saturdays for seed dates.`);
  }

  const jobSpecs: JobSpec[] = saturdays.map((saturdayIso, index) => ({
    saturdayIso,
    durationMinutes: [180, 210, 240, 180, 210][index] ?? 180,
    startTime: ['09:00:00', '10:00:00', '11:00:00', '13:00:00', '14:00:00'][index] ?? '10:00:00',
  }));

  const customerHourlyRate = customerHourlyChargeFromWelperRate(WELPER_HOURLY_RATE);
  let created = 0;
  let skipped = 0;

  for (const [index, job] of jobSpecs.entries()) {
    const existing = await bookingRepo
      .createQueryBuilder('b')
      .where('b.customer_id = :customerId', { customerId })
      .andWhere('b.welper_id = :welperId', { welperId })
      .andWhere('b.scheduled_date = :scheduledDate', { scheduledDate: job.saturdayIso })
      .andWhere('b.notes LIKE :tag', { tag: `%${PAYOUT_TEST_SEED_TAG}%` })
      .getOne();

    if (existing) {
      skipped++;
      continue;
    }

    const checkIn = torontoDateTime(job.saturdayIso, job.startTime);
    const checkOut = new Date(checkIn.getTime() + job.durationMinutes * 60 * 1000);
    const acceptedAt = new Date(checkIn.getTime() - 24 * 60 * 60 * 1000);
    const completedAt = new Date(checkOut.getTime() + 5 * 60 * 1000);
    const paymentReleasedAt = new Date(completedAt.getTime() + 45 * 60 * 1000);

    const subtotalCents = Math.round(customerHourlyRate * (job.durationMinutes / 60) * 100);
    const taxCents = Math.round((subtotalCents * TAX_RATE_BPS) / 10000);
    const totalCents = subtotalCents + taxCents;
    const welperGrossCents = computeWelperGrossCentsFromCustomerSubtotal(subtotalCents);
    const platformGrossCents = computePlatformGrossCents(subtotalCents);
    const stripeFeeCents = Math.max(30, Math.round(totalCents * 0.029 + 30));
    const totalPrice = totalCents / 100;

    const endHour = checkOut.toLocaleTimeString('en-GB', {
      timeZone: TORONTO_TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const booking = await bookingRepo.save(
      bookingRepo.create({
        customerId,
        welperId,
        serviceOfferingId,
        answers: { seedTag: PAYOUT_TEST_SEED_TAG, jobIndex: index + 1 },
        status: BookingRequestStatus.PAYMENT_RELEASED,
        scheduledDate: job.saturdayIso,
        scheduledStartTime: job.startTime,
        scheduledEndTime: endHour,
        durationMinutes: job.durationMinutes,
        timezoneOffsetMinutes: -240,
        hourlyRate: customerHourlyRate,
        totalPrice,
        address: {
          line1: '123 Seed Street',
          city: 'Montreal',
          province: 'QC',
          postalCode: 'H2X 1Y4',
          country: 'CA',
        },
        notes: `${PAYOUT_TEST_SEED_TAG} — payout QA job ${index + 1} (${job.saturdayIso})`,
        acceptedAt,
        checkedInAt: checkIn,
        checkedOutAt: checkOut,
        completedAt,
        paymentReleasedAt,
      }),
    );

    await receiptRepo.save(
      receiptRepo.create({
        bookingId: booking.id,
        billingCheckInAt: checkIn,
        billingCheckOutAt: checkOut,
        hourlyRate: String(customerHourlyRate),
        subtotalCents,
        taxCents,
        taxRateBps: TAX_RATE_BPS,
        stripeTaxCalculationId: `seed_taxcalc_${booking.id}`,
        totalCents,
        currency: 'cad',
        notes: 'Seeded service receipt for payout testing.',
        confirmedAt: completedAt,
        sentToCustomerAt: paymentReleasedAt,
        evidenceFiles: [],
      }),
    );

    await paymentRepo.save(
      paymentRepo.create({
        bookingId: booking.id,
        customerId,
        welperId,
        stripePaymentIntentId: `seed_pi_payout50_${booking.id}`,
        amountCents: totalCents,
        currency: 'cad',
        status: BookingPaymentRecordStatus.CAPTURED,
        paymentKind: BookingPaymentKind.HOLD,
        capturedAmountCents: totalCents,
        captureEligibleAt: completedAt,
        capturedAt: paymentReleasedAt,
        refundedAmountCents: 0,
        stripeBalanceTransactionId: `seed_btxn_${booking.id}`,
        stripeFeeCents,
      }),
    );

    await ledgerRepo.save(
      ledgerRepo.create({
        bookingId: booking.id,
        welperId,
        customerId,
        paymentReleasedAt,
        customerSubtotalCents: subtotalCents,
        customerTaxCents: taxCents,
        customerTotalCents: totalCents,
        welperGrossCents,
        welperRefundCents: 0,
        welperNetCents: welperGrossCents,
        platformGrossCents,
        stripeFeeCents,
        status: WelperPayoutLedgerStatus.PENDING,
        exclusionReason: null,
        payoutBatchId: null,
        stripeTransferId: null,
      }),
    );

    created++;
    console.log(
      `   ✅ Job ${index + 1}: ${job.saturdayIso} — welper net ${(welperGrossCents / 100).toFixed(2)} CAD`,
    );
  }

  console.log(`✅ Payout test bookings: ${created} created, ${skipped} already existed.`);
  console.log(`   Welper: ${PAYOUT_TEST_WELPER_EMAIL} / ${WELPER_PASSWORD}`);
  console.log(`   Customer: ${PAYOUT_TEST_CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`);
}
