import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BookingTaxService } from './booking-tax.service';
import { ApplicationSettingsService } from './application-settings.service';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import type { BookingTaxContext } from './booking-tax.types';

describe('BookingTaxService', () => {
  let service: BookingTaxService;
  let taxCalculationsCreate: jest.Mock;

  const booking: BookingTaxContext = {
    id: 'booking-1',
    customerId: 'customer-1',
    hourlyRate: '50',
    address: {
      street: '10 King St',
      city: 'Toronto',
      region: 'ON',
      postalCode: 'M5H 1A1',
      country: 'CA',
    },
  };

  const mockCustomerProfileRepo = {
    findOne: jest.fn(),
  };

  const mockApplicationSettings = {
    getBookingTaxRateBps: jest.fn().mockResolvedValue(1300),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    taxCalculationsCreate = jest.fn().mockResolvedValue({
      id: 'taxcalc_test',
      tax_amount_exclusive: 650,
      amount_total: 5650,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingTaxService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return 'sk_test_x';
              return undefined;
            }),
          },
        },
        { provide: ApplicationSettingsService, useValue: mockApplicationSettings },
        { provide: getRepositoryToken(CustomerProfile), useValue: mockCustomerProfileRepo },
      ],
    }).compile();

    service = module.get(BookingTaxService);
    (service as unknown as { stripe: { tax: { calculations: { create: jest.Mock } } } }).stripe = {
      tax: { calculations: { create: taxCalculationsCreate } },
    };
  });

  describe('quoteAuthorizationHold', () => {
    it('calculates one-hour hold subtotal and tax via Stripe Tax', async () => {
      const quote = await service.quoteAuthorizationHold(booking);

      expect(taxCalculationsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'cad',
          line_items: [
            expect.objectContaining({
              amount: 5000,
              reference: 'hold-booking-1',
            }),
          ],
          customer_details: expect.objectContaining({
            address: expect.objectContaining({
              state: 'ON',
              country: 'CA',
            }),
          }),
        }),
      );
      expect(quote).toEqual({
        subtotalCents: 5000,
        taxCents: 650,
        totalCents: 5650,
        taxRateBps: 1300,
        stripeTaxCalculationId: 'taxcalc_test',
      });
    });
  });

  describe('quoteScheduledJobTotal', () => {
    it('falls back to legacy bps when Stripe is unavailable', async () => {
      (service as unknown as { stripe: null }).stripe = null;

      const result = await service.quoteScheduledJobTotal(booking, 120);

      expect(mockApplicationSettings.getBookingTaxRateBps).toHaveBeenCalled();
      expect(result.totalDollars).toBe(113);
      expect(result.quote).toBeNull();
    });
  });

  describe('resolveTaxAddressForBooking', () => {
    it('throws when no complete address is available', async () => {
      mockCustomerProfileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resolveTaxAddressForBooking({
          ...booking,
          address: null,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falls back to customer profile address', async () => {
      mockCustomerProfileRepo.findOne.mockResolvedValue({
        address: {
          streetAddress: '123 Main St',
          city: 'Montreal',
          stateProvince: 'QC',
          zipPostalCode: 'H2X 1Y4',
          country: 'CA',
        },
      });

      const address = await service.resolveTaxAddressForBooking({
        ...booking,
        address: null,
      });

      expect(address.state).toBe('QC');
    });
  });
});
