import { NotificationService } from './notification.service';
import { getPaymentNotificationCopy } from '@welpco/email';

describe('NotificationService.emitForUser localization', () => {
  it('resolves French payment copy from template type', async () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'u1', preferredLocale: 'fr' }),
    };
    const preferenceRepo = {
      findOne: jest.fn().mockResolvedValue({ emailEnabled: true, inAppEnabled: true }),
    };
    const notificationRepo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => ({ ...row, id: 'n1' })),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      })),
    };
    const emailNotificationService = {
      sendPaymentEmailForUser: jest.fn().mockResolvedValue(undefined),
    };

    const service = new NotificationService(
      notificationRepo as never,
      preferenceRepo as never,
      userRepo as never,
      emailNotificationService as never,
    );

    await service.emitForUser('u1', {
      category: 'payment' as never,
      paymentEmailType: 'payment_captured_customer',
      paymentEmailVariables: { amount: '25.00', currency: 'CAD' },
      metadata: { bookingId: 'b1', kind: 'captured-customer' },
    });

    const expected = getPaymentNotificationCopy('payment_captured_customer', 'fr', {
      amount: '25.00',
      currency: 'CAD',
    });
    expect(notificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expected.title,
        body: expected.body,
      }),
    );
    expect(emailNotificationService.sendPaymentEmailForUser).toHaveBeenCalledWith(
      'u1',
      'payment_captured_customer',
      expect.objectContaining({
        bookingUrl: 'http://localhost:8080/fr/dashboard/bookings/b1',
      }),
    );
  });

  it('sends generic notifications with the branded email template', async () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'u1', preferredLocale: 'en' }),
    };
    const preferenceRepo = {
      findOne: jest.fn().mockResolvedValue({ emailEnabled: true, inAppEnabled: true }),
    };
    const notificationRepo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => ({ ...row, id: 'n1' })),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      })),
    };
    const emailNotificationService = {
      sendGenericNotificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const service = new NotificationService(
      notificationRepo as never,
      preferenceRepo as never,
      userRepo as never,
      emailNotificationService as never,
    );

    await service.emitForUser('u1', {
      category: 'message' as never,
      title: 'New message',
      body: 'Hello there',
      link: 'http://localhost:8080/dashboard/messages/b1',
      metadata: { bookingId: 'b1', kind: 'message' },
    });

    expect(emailNotificationService.sendGenericNotificationEmail).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        title: 'New message',
        body: 'Hello there',
        actionUrl: 'http://localhost:8080/dashboard/messages/b1',
        locale: 'en',
      }),
    );
  });
});
