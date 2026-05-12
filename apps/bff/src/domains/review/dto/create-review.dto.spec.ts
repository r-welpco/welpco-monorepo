import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReviewDto } from './create-review.dto';

/**
 * Day 12 audit: review creation DTO contract.
 *
 * Bible §22.6 trust contract: the rating signal must be 1–5 integer-only
 * with no zero / no decimal escape hatch. The comment field must be capped so
 * an attacker hitting the API directly can't store a 100K-char block.
 *
 * Specs mirror the Day 11 booking DTO spec format — `plainToInstance` builds
 * the DTO the same way Nest's validation pipe does, so the same code path is
 * exercised here as in production.
 */
describe('CreateReviewDto', () => {
  function makeDto(overrides: Partial<Record<string, unknown>> = {}) {
    return plainToInstance(CreateReviewDto, { rating: 5, ...overrides });
  }

  it('accepts a valid 5-star review with no comment', async () => {
    const errors = await validate(makeDto());
    expect(errors).toEqual([]);
  });

  it('accepts a valid 1-star review with a comment', async () => {
    const errors = await validate(
      makeDto({ rating: 1, comment: 'Service did not match the description.' }),
    );
    expect(errors).toEqual([]);
  });

  it('coerces stringified integers to numbers (form / query parity)', async () => {
    const dto = makeDto({ rating: '4' });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
    expect(dto.rating).toBe(4);
  });

  it('rejects rating = 0 (no zero-star reviews)', async () => {
    const errors = await validate(makeDto({ rating: 0 }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toBeDefined();
  });

  it('rejects rating > 5', async () => {
    const errors = await validate(makeDto({ rating: 6 }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects decimal ratings (integers only)', async () => {
    const errors = await validate(makeDto({ rating: 4.5 }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects negative ratings', async () => {
    const errors = await validate(makeDto({ rating: -1 }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a comment up to 2000 characters', async () => {
    const errors = await validate(
      makeDto({ comment: 'a'.repeat(2000) }),
    );
    expect(errors).toEqual([]);
  });

  it('rejects a comment longer than 2000 characters', async () => {
    const errors = await validate(
      makeDto({ comment: 'a'.repeat(2001) }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts an empty comment (undefined / not provided)', async () => {
    const errors = await validate(makeDto({}));
    expect(errors).toEqual([]);
  });
});
