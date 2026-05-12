import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount } from '../../domains/user-management/entities/user-account.entity';
import { EmailVerifiedGuard } from './email-verified.guard';

/**
 * Day 15 — Phase 3 of the signup ↔ onboarding merge.
 *
 * Provides the `EmailVerifiedGuard` (and the `UserAccount` repository it
 * depends on) to consuming feature modules. Booking, payment, and the
 * email-change endpoint all import this module to apply the guard via
 * `@UseGuards(EmailVerifiedGuard)` after `JwtAuthGuard`.
 *
 * Centralising the wiring here keeps the guard's repository token in one
 * place — feature modules no longer need to remember to add `UserAccount`
 * to their own `TypeOrmModule.forFeature` lists just to use the guard.
 *
 * `TypeOrmModule` is re-exported so Nest can inject `UserAccount` when the
 * guard is resolved in importing modules (e.g. BookingModule).
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserAccount])],
  providers: [EmailVerifiedGuard],
  exports: [TypeOrmModule, EmailVerifiedGuard],
})
export class EmailVerifiedGuardModule {}
