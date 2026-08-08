import { normalizeMarketplaceDescription, validateMarketplaceDescription } from './marketplace-description.validator';

describe('validateMarketplaceDescription', () => {
  it('normalizes accents, case, compatibility characters, and punctuation', () => {
    expect(normalizeMarketplaceDescription('  NÉGOCIATION—ＦＡＣＩＬＥ! ')).toBe('negociation facile');
  });

  it.each([
    'Contact me at name@gmail.com',
    'Contact name at gmail dot com',
    'Écrivez à name arobase gmail point com',
    'name (at) mail (dot) example (dot) fr',
    'name at gmail.com',
    'name@gmail dot com',
    'name @ gmail dot com',
    'name arobase gmail.com',
    'name(at)gmail.com',
    'john.doe+jobs@gmail.com',
  ])('detects email content: %s', (value) => {
    expect(validateMarketplaceDescription(value).violations).toContain('email');
  });

  it.each([
    'Call +1 (416) 555-0199',
    'one four three five five five zero one nine nine',
    'un quatre trois cinq cinq cinq zéro un neuf neuf',
    '1 four trois 5 five cinq 0 one 9',
    '438 then 872 then 8792',
    'four three eight dot eight seven two dot eight seven nine two',
    'call four three eight oh one double five nine nine',
    'appelez quatre trois huit point huit sept deux point huit sept neuf deux',
  ])('detects phone content: %s', (value) => {
    expect(validateMarketplaceDescription(value).violations).toContain('phone');
  });

  it.each([
    'The price is negotiable',
    'We can start negotiating later',
    'Toute négociation est interdite',
    'Le prix est negociable',
    'Vous pouvez négocier',
    'Vous negociez le prix',
    'Nous negocions le prix',
    'Il negociera le prix',
    'Le prix se negociait',
    'We can renegotiate',
    'Une renégociation est possible',
    'n e g o t i a t e the rate',
    'negot1ate the rate',
  ])('detects negotiation content: %s', (value) => {
    expect(validateMarketplaceDescription(value).violations).toContain('negotiation');
  });

  it('returns every violation once', () => {
    expect(validateMarketplaceDescription('Negotiate by email at name at gmail dot com or call 416 555 0199')).toEqual({
      valid: false,
      violations: ['email', 'phone', 'negotiation'],
    });
  });

  it.each([
    'Reliable cleaning for a one-bedroom apartment.',
    'I have one dog and four rooms that need care.',
    'Experienced local painter with careful attention to detail.',
    'The catalog reference is xnegotiationy.',
    'My project code is 1234567.',
    'Available on 2026 08 08.',
    'I have one two three four five six seven years of examples.',
  ])('accepts benign marketplace content: %s', (value) => {
    expect(validateMarketplaceDescription(value)).toEqual({
      valid: true,
      violations: [],
    });
  });
});
