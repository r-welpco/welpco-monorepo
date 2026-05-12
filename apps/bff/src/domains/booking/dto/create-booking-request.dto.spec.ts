import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBookingRequestDto } from './create-booking-request.dto';

/**
 * Day 11 audit: booking creation DTO contract.
 *
 * Locks down two regressions the audit caught:
 *
 * 1. `durationMinutes` was unbounded above. A user with a typo (e.g. "12:00"
 *    PM/AM mix-up — 24h delta) could create a booking spanning more than a
 *    day, which the booking-detail UI can't render and the receipt flow
 *    can't bill cleanly. New `[15, 720]` window aligns with reality (a
 *    marketplace booking longer than 12h is a UI mistake).
 *
 * 2. `notes` accepted arbitrarily long strings. Anyone hitting the API
 *    directly could store a 100K-char block of text that the booking-detail
 *    Card can't render. New `MaxLength(2000)` aligns with the FE textarea.
 *
 * These specs build the DTO with `plainToInstance` (matching how Nest
 * dispatches it through the validation pipe) so the same code path the
 * controller uses is exercised here.
 */
describe('CreateBookingRequestDto', () => {
  const baseDto = {
    welperId: '00000000-0000-4000-a000-000000000001',
    offeringId: '00000000-0000-4000-a000-000000000002',
    answers: {},
    scheduledDate: '2026-06-15',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    durationMinutes: 120,
  } as const;

  function makeDto(overrides: Partial<Record<string, unknown>> = {}) {
    return plainToInstance(CreateBookingRequestDto, { ...baseDto, ...overrides });
  }

  it('accepts a valid 2-hour booking', async () => {
    const errors = await validate(makeDto());
    expect(errors).toEqual([]);
  });

  it('accepts a 15-minute booking (lower boundary)', async () => {
    const errors = await validate(
      makeDto({ durationMinutes: 15, scheduledStartTime: '09:00', scheduledEndTime: '09:15' }),
    );
    expect(errors).toEqual([]);
  });

  it('accepts a 12-hour booking (upper boundary)', async () => {
    const errors = await validate(
      makeDto({ durationMinutes: 720, scheduledStartTime: '08:00', scheduledEndTime: '20:00' }),
    );
    expect(errors).toEqual([]);
  });

  it('rejects a booking shorter than 15 minutes', async () => {
    const errors = await validate(makeDto({ durationMinutes: 10 }));
    const dur = errors.find((e) => e.property === 'durationMinutes');
    expect(dur).toBeDefined();
    expect(JSON.stringify(dur?.constraints ?? {})).toMatch(/min/i);
  });

  it('rejects a booking longer than 720 minutes (12 hours)', async () => {
    const errors = await validate(makeDto({ durationMinutes: 1440 }));
    const dur = errors.find((e) => e.property === 'durationMinutes');
    expect(dur).toBeDefined();
    expect(JSON.stringify(dur?.constraints ?? {})).toMatch(/max/i);
  });

  it('rejects scheduledEndTime equal to scheduledStartTime', async () => {
    const errors = await validate(
      makeDto({ scheduledStartTime: '09:00', scheduledEndTime: '09:00' }),
    );
    const end = errors.find((e) => e.property === 'scheduledEndTime');
    expect(end).toBeDefined();
  });

  it('rejects scheduledEndTime before scheduledStartTime', async () => {
    const errors = await validate(
      makeDto({ scheduledStartTime: '11:00', scheduledEndTime: '09:00' }),
    );
    const end = errors.find((e) => e.property === 'scheduledEndTime');
    expect(end).toBeDefined();
    expect(JSON.stringify(end?.constraints ?? {})).toMatch(/after/i);
  });

  it('rejects malformed time strings', async () => {
    const errors = await validate(makeDto({ scheduledStartTime: '9:00' }));
    const start = errors.find((e) => e.property === 'scheduledStartTime');
    expect(start).toBeDefined();
  });

  it('accepts notes of moderate length', async () => {
    const errors = await validate(makeDto({ notes: 'Door code is 1234. Thanks!' }));
    expect(errors).toEqual([]);
  });

  it('rejects notes longer than 2000 characters', async () => {
    const errors = await validate(makeDto({ notes: 'x'.repeat(2001) }));
    const notes = errors.find((e) => e.property === 'notes');
    expect(notes).toBeDefined();
  });

  it('accepts notes at exactly 2000 characters (upper boundary)', async () => {
    const errors = await validate(makeDto({ notes: 'x'.repeat(2000) }));
    expect(errors).toEqual([]);
  });
});
