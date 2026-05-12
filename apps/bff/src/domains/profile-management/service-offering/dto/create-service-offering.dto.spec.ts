import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateServiceOfferingDto } from './create-service-offering.dto';

/**
 * Day 10 audit fix: hourlyRate previously had only `@Min(0)` — accepting $0/hr
 * (data-entry mistake) and arbitrarily large values like 999999 (typo or abuse)
 * which would distort search filters + percentile sort. The new bounds (1–1000)
 * keep premium concierge rates within range while rejecting garbage.
 */
describe('CreateServiceOfferingDto', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  function makeDto(overrides: Partial<Record<string, unknown>> = {}) {
    return plainToInstance(CreateServiceOfferingDto, {
      serviceCategoryId: validUuid,
      serviceDescription: 'Professional cleaning and maintenance.',
      hourlyRate: 50,
      experienceYears: 5,
      ...overrides,
    });
  }

  it('accepts a $50/hr offering', async () => {
    const errors = await validate(makeDto());
    expect(errors).toEqual([]);
  });

  it('accepts the boundary value of $1', async () => {
    const errors = await validate(makeDto({ hourlyRate: 1 }));
    expect(errors).toEqual([]);
  });

  it('accepts the boundary value of $1000', async () => {
    const errors = await validate(makeDto({ hourlyRate: 1000 }));
    expect(errors).toEqual([]);
  });

  it('rejects $0 (free tier is not a feature)', async () => {
    const errors = await validate(makeDto({ hourlyRate: 0 }));
    expect(errors.length).toBeGreaterThan(0);
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/at least 1/);
  });

  it('rejects negative rates', async () => {
    const errors = await validate(makeDto({ hourlyRate: -5 }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects rates above $1,000/hr (typo / abuse defence)', async () => {
    const errors = await validate(makeDto({ hourlyRate: 9999 }));
    expect(errors.length).toBeGreaterThan(0);
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/at most 1000/);
  });

  it('rejects rates with more than 2 decimal places', async () => {
    const errors = await validate(makeDto({ hourlyRate: 49.999 }));
    expect(errors.length).toBeGreaterThan(0);
  });
});
