import {
  getBookingEmailSubject,
  getBookingNotificationCopy,
  getDisputeEmailSubject,
  getDisputeNotificationCopy,
  getPaymentEmailSubject,
  getPaymentNotificationCopy,
} from '@welpco/email';
import {
  buildBookingActionUrl,
  buildDisputeActionUrl,
} from './notification-locale.helper';

describe('localized notification templates', () => {
  it('returns French booking email subjects', () => {
    expect(getBookingEmailSubject('booking_accepted', 'fr')).toContain('acceptée');
    expect(getBookingEmailSubject('booking_payment_released', 'fr')).toContain('finalisée');
  });

  it('returns French booking in-app copy', () => {
    const copy = getBookingNotificationCopy('booking_checked_in', 'fr', {
      welperName: 'Marie',
      serviceName: 'Ménage',
    });
    expect(copy.title).toBe('Welper enregistré');
    expect(copy.body).toContain('Marie');
  });

  it('returns French payment and dispute subjects', () => {
    expect(getPaymentEmailSubject('payment_refund', 'fr')).toContain('Remboursement');
    expect(getDisputeEmailSubject('dispute_filed', 'fr')).toContain('signalement');
  });

  it('returns French payment notification copy', () => {
    const copy = getPaymentNotificationCopy('payment_captured_customer', 'fr', {
      amount: '50.00',
      currency: 'CAD',
    });
    expect(copy.body).toContain('50.00 CAD');
  });

  it('returns French dispute notification copy', () => {
    const copy = getDisputeNotificationCopy('dispute_withdrawn', 'fr', {
      subject: 'retard',
    });
    expect(copy.title).toBe('Signalement retiré');
  });
});

describe('notification locale URLs', () => {
  it('prefixes French dashboard paths', () => {
    expect(buildBookingActionUrl('http://localhost:8080', 'b1', 'fr')).toBe(
      'http://localhost:8080/fr/dashboard/bookings/b1',
    );
    expect(buildDisputeActionUrl('http://localhost:8080', 'd1', 'en')).toBe(
      'http://localhost:8080/dashboard/disputes/d1',
    );
  });
});
