import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateWelperProfileDto } from './update-welper-profile.dto';

/**
 * Day 10 audit fix: bio previously had no length validator on the BFF, so the
 * frontend's 600-char zod cap was the only defence. Anyone calling the API
 * directly could store a 50,000-char bio and slow down the search results
 * grid that renders these. New bounds (50–2000) match the FE form's minimum
 * and a generous-but-bounded maximum.
 */
describe('UpdateWelperProfileDto', () => {
  it('accepts a bio at the 50-char minimum', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'x'.repeat(50),
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('accepts a bio at the 2000-char maximum', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'x'.repeat(2000),
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('rejects a bio shorter than 50 characters', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'too short',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/at least 50 characters/);
  });

  it('rejects a bio longer than 2000 characters', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'x'.repeat(2001),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/at most 2000 characters/);
  });

  it('allows bio to be omitted (PATCH semantics)', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      firstName: 'Jane',
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });
});
