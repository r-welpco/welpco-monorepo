import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { BookingServiceReceipt } from '../booking/entities/booking-service-receipt.entity';
import { BookingPayment } from './entities/booking-payment.entity';
import { WelperPayoutLedgerStatus } from './entities/payout-ledger-status.enum';

describe('WelperPayoutLedgerService', () => {
  let service: WelperPayoutLedgerService;

  const mockLedgerRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (row: WelperPayoutLedger) => row),
    create: jest.fn((row: Partial<WelperPayoutLedger>) => ({ id: 'ledger-1', ...row })),
    update: jest.fn(),
  };
  const mockBookingRepo = { findOne: jest.fn() };
  const mockReceiptRepo = { findOne: jest.fn() };
  const mockBookingPaymentRepo = { find: jest.fn().mockResolvedValue([]) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WelperPayoutLedgerService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => undefined) },
        },
        { provide: getRepositoryToken(WelperPayoutLedger), useValue: mockLedgerRepo },
        { provide: getRepositoryToken(BookingRequest), useValue: mockBookingRepo },
        { provide: getRepositoryToken(BookingServiceReceipt), useValue: mockReceiptRepo },
        { provide: getRepositoryToken(BookingPayment), useValue: mockBookingPaymentRepo },
      ],
    }).compile();
    service = module.get(WelperPayoutLedgerService);
  });

  describe('createLedgerForPaymentReleased', () => {
    const booking = {
      id: 'booking-1',
      welperId: 'w1',
      customerId: 'c1',
      status: BookingRequestStatus.PAYMENT_RELEASED,
      paymentReleasedAt: new Date('2026-06-01T12:00:00.000Z'),
    } as BookingRequest;

    const receipt = {
      subtotalCents: 12500,
      taxCents: 1625,
      totalCents: 14125,
    } as BookingServiceReceipt;

    beforeEach(() => {
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockReceiptRepo.findOne.mockResolvedValue(receipt);
    });

    it('does not duplicate when ledger already exists as pending', async () => {
      const existing = {
        id: 'ledger-1',
        bookingId: 'booking-1',
        status: WelperPayoutLedgerStatus.PENDING,
        welperRefundCents: 0,
      } as WelperPayoutLedger;
      mockLedgerRepo.findOne.mockResolvedValue(existing);

      await service.createLedgerForPaymentReleased('booking-1');

      expect(mockLedgerRepo.save).toHaveBeenCalledTimes(1);
      expect(mockLedgerRepo.create).not.toHaveBeenCalled();
      expect(existing.welperGrossCents).toBe(10000);
      expect(existing.platformGrossCents).toBe(2500);
    });

    it('returns existing row without update when already transferred', async () => {
      const existing = {
        id: 'ledger-1',
        bookingId: 'booking-1',
        status: WelperPayoutLedgerStatus.TRANSFERRED,
      } as WelperPayoutLedger;
      mockLedgerRepo.findOne.mockResolvedValue(existing);

      const result = await service.createLedgerForPaymentReleased('booking-1');

      expect(result).toBe(existing);
      expect(mockLedgerRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('applyRefundDelta', () => {
    it('caps cumulative welper refund at welper gross', async () => {
      mockLedgerRepo.findOne.mockResolvedValue({
        id: 'ledger-1',
        bookingId: 'booking-1',
        customerSubtotalCents: 12500,
        customerTotalCents: 14125,
        welperGrossCents: 10000,
        welperRefundCents: 9000,
        welperNetCents: 1000,
        status: WelperPayoutLedgerStatus.PENDING,
      });

      await service.applyRefundDelta('booking-1', 14125);

      const saved = mockLedgerRepo.save.mock.calls[0]?.[0];
      expect(saved.welperRefundCents).toBe(10000);
      expect(saved.welperNetCents).toBe(0);
      expect(saved.status).toBe(WelperPayoutLedgerStatus.EXCLUDED);
    });
  });
});
