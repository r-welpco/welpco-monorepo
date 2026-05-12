import { majorCurrencyUnitsToCents } from './money';

describe('majorCurrencyUnitsToCents', () => {
  it('converts common decimals without float drift', () => {
    expect(majorCurrencyUnitsToCents(10.03)).toBe(1003);
    expect(majorCurrencyUnitsToCents(19.99)).toBe(1999);
    expect(majorCurrencyUnitsToCents(0.01)).toBe(1);
    expect(majorCurrencyUnitsToCents(100)).toBe(10000);
  });

  it('throws for invalid values', () => {
    expect(() => majorCurrencyUnitsToCents(0)).toThrow();
    expect(() => majorCurrencyUnitsToCents(-1)).toThrow();
    expect(() => majorCurrencyUnitsToCents(Number.NaN)).toThrow();
  });
});
