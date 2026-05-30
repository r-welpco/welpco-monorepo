import { Repository } from 'typeorm';
import { localePathPrefix, type UserPreferredLocale } from '../../common/preferred-locale';
import { emailLocaleForUser } from '../user-management/auth/user-locale.helper';
import { UserAccount } from '../user-management/entities/user-account.entity';

export async function resolveUserLocale(
  userRepo: Repository<UserAccount>,
  userId: string,
): Promise<UserPreferredLocale> {
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    return 'en';
  }
  return emailLocaleForUser(user);
}

export function buildBookingActionUrl(
  frontendUrl: string,
  bookingId: string,
  locale: UserPreferredLocale,
): string {
  const prefix = localePathPrefix(locale);
  return `${frontendUrl}${prefix}/dashboard/bookings/${bookingId}`;
}

export function buildDisputeActionUrl(
  frontendUrl: string,
  disputeId: string,
  locale: UserPreferredLocale,
): string {
  const prefix = localePathPrefix(locale);
  return `${frontendUrl}${prefix}/dashboard/disputes/${disputeId}`;
}

export function getFrontendBaseUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:8080';
}
