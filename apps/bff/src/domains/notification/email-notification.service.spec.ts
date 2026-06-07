import { ConfigService } from '@nestjs/config';
import { EmailNotificationService } from './email-notification.service';
import { GuardianConsentStatus } from '../safety-verification/entities/minor-guardian-consent.entity';
import { AccountType } from '../user-management/entities/user-account.entity';

describe('EmailNotificationService guardian copies', () => {
  it('sends the guardian copy in the minor preferred language', async () => {
    const emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'minor-1',
        email: 'minor@example.com',
        accountType: AccountType.WELPER,
        preferredLocale: 'fr',
      }),
    };
    const guardianConsentRepo = {
      findOne: jest.fn().mockResolvedValue({
        guardianEmail: 'guardian@example.com',
        status: GuardianConsentStatus.APPROVED,
      }),
    };
    const configService = {
      get: jest.fn((key: string) =>
        key === 'FRONTEND_URL' ? 'https://welpco.example' : undefined,
      ),
    };
    const service = new EmailNotificationService(
      configService as unknown as ConfigService,
      emailService as never,
      userRepo as never,
      guardianConsentRepo as never,
    );

    await service.sendBookingEmailForUser(
      'minor-1',
      'booking_created',
      { serviceName: 'Ménage' },
    );

    expect(emailService.sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: 'minor@example.com',
        subject: expect.stringContaining('Nouvelle demande'),
      }),
    );
    expect(emailService.sendEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: 'guardian@example.com',
        subject: expect.stringContaining('[Copie tuteur]'),
      }),
    );
  });

  it('does not fail the minor delivery when the guardian copy fails', async () => {
    const emailService = {
      sendEmail: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('guardian mailbox unavailable')),
    };
    const service = new EmailNotificationService(
      { get: jest.fn() } as unknown as ConfigService,
      emailService as never,
      {
        findOne: jest.fn().mockResolvedValue({
          id: 'minor-1',
          email: 'minor@example.com',
          accountType: AccountType.WELPER,
          preferredLocale: 'en',
        }),
      } as never,
      {
        findOne: jest.fn().mockResolvedValue({
          guardianEmail: 'guardian@example.com',
          status: GuardianConsentStatus.APPROVED,
        }),
      } as never,
    );

    await expect(
      service.sendPaymentEmailForUser('minor-1', 'payment_captured_welper', {
        amount: '25.00',
        currency: 'CAD',
      }),
    ).resolves.toBeUndefined();
  });
});
