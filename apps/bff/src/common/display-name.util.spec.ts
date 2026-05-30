import { formatWelperDisplayNameForCustomer } from './display-name.util';

describe('formatWelperDisplayNameForCustomer', () => {
  it('returns first name and last initial', () => {
    expect(formatWelperDisplayNameForCustomer('Jane', 'Doe')).toBe('Jane D.');
  });

  it('returns first name only when last name missing', () => {
    expect(formatWelperDisplayNameForCustomer('Jane', null)).toBe('Jane');
  });

  it('returns fallback when both names missing', () => {
    expect(formatWelperDisplayNameForCustomer(null, null, 'Welper')).toBe('Welper');
  });
});
