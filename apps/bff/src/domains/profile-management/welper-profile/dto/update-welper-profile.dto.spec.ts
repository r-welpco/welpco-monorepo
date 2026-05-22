import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateWelperProfileDto } from './update-welper-profile.dto';

describe('UpdateWelperProfileDto', () => {
  it('accepts a bio at the 20-char minimum', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'x'.repeat(20),
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('accepts a bio at the 600-char maximum', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'x'.repeat(600),
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('rejects a bio shorter than 20 characters', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'too short',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/at least 20 characters/);
  });

  it('rejects a bio longer than 600 characters', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      bio: 'x'.repeat(601),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/at most 600 characters/);
  });

  it('allows bio to be omitted (PATCH semantics)', async () => {
    const dto = plainToInstance(UpdateWelperProfileDto, {
      firstName: 'Jane',
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });
});
