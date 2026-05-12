import { Injectable, Logger } from '@nestjs/common';

export interface UserCreatedEvent {
  userId: string;
  email: string;
  accountType: string;
  timestamp: string;
}

export interface UserSignedInEvent {
  userId: string;
  email: string;
  timestamp: string;
}

export interface EmailVerificationRequestedEvent {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface EmailVerifiedEvent {
  userId: string;
  email: string;
  timestamp: string;
}

export interface AccountStatusChangedEvent {
  userId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface ReferralCodeGeneratedEvent {
  userId: string;
  referralCodeId: string;
  code: string;
  timestamp: string;
}

export interface ReferralCreatedEvent {
  referralId: string;
  referrerUserId: string;
  refereeUserId: string;
  referralCodeId: string;
  timestamp: string;
}

export interface ReferralCompletedEvent {
  referralId: string;
  referrerUserId: string;
  refereeUserId: string;
  completionDate: string;
  timestamp: string;
}

export interface ReferralRewardEarnedEvent {
  referralId: string;
  referrerUserId: string;
  refereeUserId: string;
  rewardAmount: number;
  timestamp: string;
}

export interface PasswordResetRequestedEvent {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface PasswordResetCompletedEvent {
  userId: string;
  email: string;
  timestamp: string;
}

/**
 * No-op event publisher (Kafka removed; synchronous flow used for user.created via ProfileCreationService).
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  async publishUserCreated(_event: UserCreatedEvent): Promise<void> {
    // Replaced by sync ProfileCreationService.createProfileForUser in AuthService
  }

  async publishUserSignedIn(_event: UserSignedInEvent): Promise<void> {}

  async publishEmailVerificationRequested(
    _event: EmailVerificationRequestedEvent,
  ): Promise<void> {}

  async publishEmailVerified(_event: EmailVerifiedEvent): Promise<void> {}

  async publishAccountStatusChanged(
    _event: AccountStatusChangedEvent,
  ): Promise<void> {}

  async publishReferralCodeGenerated(
    _event: ReferralCodeGeneratedEvent,
  ): Promise<void> {}

  async publishReferralCreated(_event: ReferralCreatedEvent): Promise<void> {}

  async publishReferralCompleted(
    _event: ReferralCompletedEvent,
  ): Promise<void> {}

  async publishReferralRewardEarned(
    _event: ReferralRewardEarnedEvent,
  ): Promise<void> {}

  async publishPasswordResetRequested(
    _event: PasswordResetRequestedEvent,
  ): Promise<void> {}

  async publishPasswordResetCompleted(
    _event: PasswordResetCompletedEvent,
  ): Promise<void> {}
}
