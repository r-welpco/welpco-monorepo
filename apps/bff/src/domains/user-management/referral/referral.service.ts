import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ReferralCode, CodeType } from '../entities/referral-code.entity';
import { Referral, ReferralStatus } from '../entities/referral.entity';
import { UserAccount } from '../entities/user-account.entity';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(ReferralCode)
    private referralCodeRepository: Repository<ReferralCode>,
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    private eventPublisher: EventPublisherService,
  ) {}

  /**
   * Generate a personal referral code for a user.
   * @param userId - The user's id (must exist in user_accounts when not using manager).
   * @param manager - Optional EntityManager to run the insert in an existing transaction (e.g. during registration).
   */
  async generateReferralCode(userId: string, manager?: EntityManager): Promise<ReferralCode> {
    const repo = manager ? manager.getRepository(ReferralCode) : this.referralCodeRepository;

    const existingCode = await repo.findOne({
      where: { userId, isActive: true },
    });

    if (existingCode) {
      return existingCode;
    }

    const code = this.generateUniqueCode();

    const referralCode = repo.create({
      userId,
      code,
      codeType: CodeType.PERSONAL,
      isActive: true,
    });

    const savedCode = await repo.save(referralCode);

    if (!manager) {
      await this.eventPublisher.publishReferralCodeGenerated({
        userId,
        referralCodeId: savedCode.id,
        code: savedCode.code,
        timestamp: new Date().toISOString(),
      });
    }

    return savedCode;
  }

  async getReferralCode(userId: string): Promise<ReferralCode | null> {
    return this.referralCodeRepository.findOne({
      where: { userId, isActive: true },
    });
  }

  /**
   * Apply a referral code for a new user (e.g. during registration).
   * @param manager - Optional EntityManager to run in an existing transaction so referee_user_id FK is visible.
   */
  async applyReferralCode(
    code: string,
    newUserId: string,
    manager?: EntityManager,
  ): Promise<Referral> {
    const referralCodeRepo = manager ? manager.getRepository(ReferralCode) : this.referralCodeRepository;
    const referralRepo = manager ? manager.getRepository(Referral) : this.referralRepository;

    const referralCode = await referralCodeRepo.findOne({
      where: { code, isActive: true },
    });

    if (!referralCode) {
      throw new NotFoundException('Invalid referral code');
    }

    if (
      referralCode.expiresAt &&
      new Date(referralCode.expiresAt) < new Date()
    ) {
      throw new BadRequestException('Referral code has expired');
    }

    if (referralCode.userId === newUserId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    const existingReferral = await referralRepo.findOne({
      where: {
        referrerUserId: referralCode.userId,
        refereeUserId: newUserId,
      },
    });

    if (existingReferral) {
      return existingReferral;
    }

    const referral = referralRepo.create({
      referrerUserId: referralCode.userId,
      refereeUserId: newUserId,
      referralCodeId: referralCode.id,
      status: ReferralStatus.PENDING,
      referralDate: new Date(),
    });

    const savedReferral = await referralRepo.save(referral);

    if (!manager) {
      await this.eventPublisher.publishReferralCreated({
        referralId: savedReferral.id,
        referrerUserId: savedReferral.referrerUserId,
        refereeUserId: savedReferral.refereeUserId,
        referralCodeId: savedReferral.referralCodeId,
        timestamp: new Date().toISOString(),
      });
    }

    return savedReferral;
  }

  async getReferralHistory(userId: string): Promise<Referral[]> {
    return this.referralRepository.find({
      where: [{ referrerUserId: userId }, { refereeUserId: userId }],
      relations: ['referrer', 'referee', 'referralCode'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalRewards: number;
  }> {
    const referrals = await this.referralRepository.find({
      where: { referrerUserId: userId },
    });

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED,
    ).length;
    const pendingReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.PENDING,
    ).length;
    const totalRewards = referrals.reduce(
      (sum, r) => sum + (r.rewardAmount || 0),
      0,
    );

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewards,
    };
  }

  async completeReferral(referralId: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: { id: referralId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (referral.status === ReferralStatus.COMPLETED) {
      return referral;
    }

    referral.status = ReferralStatus.COMPLETED;
    referral.completionDate = new Date();

    const savedReferral = await this.referralRepository.save(referral);

    // Publish event
    await this.eventPublisher.publishReferralCompleted({
      referralId: savedReferral.id,
      referrerUserId: savedReferral.referrerUserId,
      refereeUserId: savedReferral.refereeUserId,
      completionDate: (savedReferral.completionDate ?? new Date()).toISOString(),
      timestamp: new Date().toISOString(),
    });

    return savedReferral;
  }

  private generateUniqueCode(): string {
    // Generate a random 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

