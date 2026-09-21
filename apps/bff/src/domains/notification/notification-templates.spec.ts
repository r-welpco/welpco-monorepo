import {
  getBookingEmailSubject,
  getBookingNotificationCopy,
  getDisputeEmailSubject,
  getDisputeNotificationCopy,
  getJobLifecycleEmailSubject,
  getJobLifecycleNotificationCopy,
  getPaymentEmailSubject,
  getPaymentNotificationCopy,
  getPortfolioRejectedEmailSubject,
  getWelcomeEmailSubject,
  resolveCancellationVariant,
} from '@welpco/email';
import {
  buildBookingActionUrl,
  buildDisputeActionUrl,
} from './notification-locale.helper';

describe('localized notification templates', () => {
  it('returns French booking email subjects from briefs', () => {
    expect(getBookingEmailSubject('booking_accepted', 'fr')).toContain('Confirmation');
    expect(getBookingEmailSubject('booking_accepted_welper', 'en')).toContain('confirmation');
    expect(getBookingEmailSubject('booking_payment_released', 'fr')).toContain('finalisée');
    expect(getBookingEmailSubject('booking_service_receipt', 'en')).toContain('review');
  });

  it('returns French booking in-app copy', () => {
    const copy = getBookingNotificationCopy('booking_checked_in', 'fr', {
      welperName: 'Marie',
      serviceName: 'Ménage',
    });
    expect(copy.title).toBe('Welper enregistré');
    expect(copy.body).toContain('Marie');
  });

  it('selects cancellation variants from actor and window', () => {
    expect(
      resolveCancellationVariant({
        cancelledByRole: 'customer',
        cancelRecipientRole: 'customer',
        cancelWithinFreeWindow: 'true',
      }),
    ).toBe('customer_self_free');
    expect(
      resolveCancellationVariant({
        cancelledByRole: 'welper',
        cancelRecipientRole: 'customer',
        cancelWithinFreeWindow: 'false',
      }),
    ).toBe('customer_welper_late');
    expect(
      resolveCancellationVariant({
        cancelledByRole: 'admin',
        cancelRecipientRole: 'welper',
      }),
    ).toBe('generic');
  });

  it('returns French payment and dispute subjects', () => {
    expect(getPaymentEmailSubject('payment_refund', 'fr')).toContain('Remboursement');
    expect(getPaymentEmailSubject('payment_failed', 'en')).toContain('Payment issue');
    expect(getDisputeEmailSubject('dispute_filed', 'fr')).toContain('signalement');
  });

  it('returns French payment notification copy', () => {
    const copy = getPaymentNotificationCopy('payment_captured_customer', 'fr', {
      amount: '50.00',
      currency: 'CAD',
    });
    expect(copy.body.toLowerCase()).toContain('paiement');
  });

  it('returns French dispute notification copy', () => {
    const copy = getDisputeNotificationCopy('dispute_withdrawn', 'fr', {
      subject: 'retard',
    });
    expect(copy.title).toBe('Signalement retiré');
  });

  it('returns portfolio rejection subject', () => {
    expect(getPortfolioRejectedEmailSubject('en')).toContain('portfolio');
    expect(getPortfolioRejectedEmailSubject('fr')).toContain('portfolio');
  });

  it('returns job lifecycle subjects and copy', () => {
    expect(getJobLifecycleEmailSubject('job_published', 'en')).toContain('published');
    expect(getJobLifecycleEmailSubject('job_application_sent', 'fr')).toContain('candidature');
    const copy = getJobLifecycleNotificationCopy('job_application_accepted', 'en', {
      jobTitle: 'Lawn care',
    });
    expect(copy.body).toContain('Lawn care');
  });

  it('returns welcome subject from brief', () => {
    expect(getWelcomeEmailSubject('fr')).toBe('Bienvenue chez Welpco');
    expect(getWelcomeEmailSubject('en')).toBe('Welcome to Welpco');
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
