import { buildTransferIdempotencyKey } from './payout-idempotency.util';

describe('buildTransferIdempotencyKey', () => {
  it('is stable regardless of line id order', () => {
    const a = buildTransferIdempotencyKey('w1', ['l2', 'l1']);
    const b = buildTransferIdempotencyKey('w1', ['l1', 'l2']);
    expect(a).toBe(b);
    expect(a).toMatch(/^payout-welper-w1-[a-f0-9]{32}$/);
  });

  it('differs when welper or lines change', () => {
    const base = buildTransferIdempotencyKey('w1', ['l1']);
    expect(buildTransferIdempotencyKey('w2', ['l1'])).not.toBe(base);
    expect(buildTransferIdempotencyKey('w1', ['l2'])).not.toBe(base);
  });
});
