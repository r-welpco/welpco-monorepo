import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { createStripeClient } from './stripe-client';
import { ApplicationSettingsService } from './application-settings.service';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import { BOOKING_HOLD_DURATION_HOURS } from '../booking/booking-pricing';
import { resolveServiceTaxAddress } from './booking-tax-address.util';
import type { BookingTaxContext, BookingTaxQuote } from './booking-tax.types';

/** Stripe tax code: general services (override via STRIPE_BOOKING_TAX_CODE). */
const DEFAULT_BOOKING_TAX_CODE = 'txcd_20030000';

@Injectable()
export class BookingTaxService {
  private readonly logger = new Logger(BookingTaxService.name);
  private readonly stripe: Stripe | null;
  private readonly taxCode: string;

  constructor(
    private readonly config: ConfigService,
    private readonly applicationSettings: ApplicationSettingsService,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepo: Repository<CustomerProfile>,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
    this.taxCode = this.config.get<string>('STRIPE_BOOKING_TAX_CODE') ?? DEFAULT_BOOKING_TAX_CODE;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  private effectiveTaxRateBps(subtotalCents: number, taxCents: number): number {
    if (subtotalCents <= 0 || taxCents <= 0) return 0;
    return Math.round((taxCents * 10000) / subtotalCents);
  }

  private async loadCustomerAddress(customerId: string): Promise<Record<string, unknown> | null> {
    const profile = await this.customerProfileRepo.findOne({ where: { customerId } });
    const address = profile?.address;
    if (!address || typeof address !== 'object') return null;
    return address as unknown as Record<string, unknown>;
  }

  async resolveTaxAddressForBooking(booking: BookingTaxContext) {
    const customerAddress = await this.loadCustomerAddress(booking.customerId);
    const address = resolveServiceTaxAddress(booking.address, customerAddress);
    if (!address) {
      throw new BadRequestException(
        'A complete service address (street, city, province, postal code) is required for tax. ' +
          'Add it to the booking or update the customer profile address in Settings.',
      );
    }
    return address;
  }

  /**
   * Stripe Tax Calculation for a service subtotal at the booking location.
   * Amounts are tax-exclusive (same as background-check Checkout `tax_behavior: exclusive`).
   */
  async calculateServiceTax(
    booking: BookingTaxContext,
    subtotalCents: number,
    lineReference: string,
  ): Promise<BookingTaxQuote> {
    if (subtotalCents <= 0) {
      return {
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0,
        taxRateBps: 0,
        stripeTaxCalculationId: '',
      };
    }

    const address = await this.resolveTaxAddressForBooking(booking);
    const stripe = this.requireStripe();

    try {
      const calculation = await stripe.tax.calculations.create({
        currency: 'cad',
        line_items: [
          {
            amount: subtotalCents,
            reference: lineReference,
            tax_code: this.taxCode,
          },
        ],
        customer_details: {
          address: {
            line1: address.line1,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode,
            country: address.country,
          },
          address_source: 'shipping',
        },
      });

      const taxCents = calculation.tax_amount_exclusive ?? 0;
      const totalCents = calculation.amount_total ?? subtotalCents + taxCents;

      return {
        subtotalCents,
        taxCents,
        totalCents,
        taxRateBps: this.effectiveTaxRateBps(subtotalCents, taxCents),
        stripeTaxCalculationId: calculation.id ?? '',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Stripe Tax calculation failed for booking ${booking.id}: ${message}`);
      throw new BadRequestException(
        'We could not calculate tax for this booking. Check the service address and Stripe Tax settings, then try again.',
      );
    }
  }

  /** One-hour authorization hold subtotal + province tax via Stripe Tax. */
  async quoteAuthorizationHold(booking: BookingTaxContext): Promise<BookingTaxQuote> {
    const hourlyRate = booking.hourlyRate != null ? Number(booking.hourlyRate) : 0;
    if (hourlyRate <= 0) {
      return {
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0,
        taxRateBps: 0,
        stripeTaxCalculationId: '',
      };
    }
    const subtotalCents = Math.round(
      hourlyRate * BOOKING_HOLD_DURATION_HOURS * 100,
    );
    return this.calculateServiceTax(booking, subtotalCents, `hold-${booking.id}`);
  }

  /** Receipt total for actual billed minutes (subtotal supplied by caller). */
  async quoteServiceReceipt(
    booking: BookingTaxContext,
    subtotalCents: number,
    receiptReference: string,
  ): Promise<BookingTaxQuote> {
    return this.calculateServiceTax(booking, subtotalCents, receiptReference);
  }

  /**
   * Estimate job total at booking creation when duration is known.
   * Falls back to legacy bps setting only when Stripe is unavailable (local dev).
   */
  async quoteScheduledJobTotal(
    booking: BookingTaxContext,
    durationMinutes: number,
  ): Promise<{ totalDollars: number; quote: BookingTaxQuote | null }> {
    const hourlyRate = booking.hourlyRate != null ? Number(booking.hourlyRate) : 0;
    if (hourlyRate <= 0 || durationMinutes <= 0) {
      return { totalDollars: 0, quote: null };
    }
    const subtotalCents = Math.round(hourlyRate * (durationMinutes / 60) * 100);

    if (!this.stripe) {
      const taxRateBps = await this.applicationSettings.getBookingTaxRateBps();
      const taxCents = Math.round((subtotalCents * taxRateBps) / 10000);
      const totalCents = subtotalCents + taxCents;
      return { totalDollars: totalCents / 100, quote: null };
    }

    const quote = await this.calculateServiceTax(
      booking,
      subtotalCents,
      `estimate-${booking.id}`,
    );
    return { totalDollars: quote.totalCents / 100, quote };
  }
}
