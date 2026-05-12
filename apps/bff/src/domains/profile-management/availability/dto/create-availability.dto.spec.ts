import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAvailabilityDto } from './create-availability.dto';
import { DayOfWeek } from '../../entities/day-of-week.enum';
import { RecurringPattern } from '../../entities/recurring-pattern.enum';

/**
 * Day 10 audit fix: inverted slots (`endTime <= startTime`) used to pass
 * validation and silently break the booking matcher in
 * `AvailabilityService.isSlotAvailable` (HH:mm string compare → never matches).
 *
 * These specs lock the DTO contract so the regression can't sneak back in.
 */
describe('CreateAvailabilityDto', () => {
  function makeDto(overrides: Partial<Record<string, unknown>> = {}) {
    return plainToInstance(CreateAvailabilityDto, {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '17:00',
      recurringPattern: RecurringPattern.WEEKLY,
      ...overrides,
    });
  }

  it('accepts a valid 09:00–17:00 weekday slot', async () => {
    const errors = await validate(makeDto());
    expect(errors).toEqual([]);
  });

  it('accepts HH:mm:ss times (database round-trip format)', async () => {
    const errors = await validate(makeDto({ startTime: '09:00:00', endTime: '17:00:00' }));
    expect(errors).toEqual([]);
  });

  it('rejects when endTime is before startTime', async () => {
    const errors = await validate(makeDto({ startTime: '18:00', endTime: '09:00' }));
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/endTime must be after startTime/);
  });

  it('rejects when endTime equals startTime (zero-length slot)', async () => {
    const errors = await validate(makeDto({ startTime: '09:00', endTime: '09:00' }));
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/endTime must be after startTime/);
  });

  it('rejects malformed time strings (e.g. "9am")', async () => {
    const errors = await validate(makeDto({ startTime: '9am', endTime: '5pm' }));
    expect(errors.length).toBeGreaterThan(0);
    const flat = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(flat.join(' ')).toMatch(/HH:mm/);
  });

  it('rejects out-of-range times (e.g. 25:00)', async () => {
    const errors = await validate(makeDto({ startTime: '25:00', endTime: '26:00' }));
    expect(errors.length).toBeGreaterThan(0);
  });
});
