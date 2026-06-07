import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { GuardianConsentService } from './guardian-consent.service';
import {
  GuardianConsentStatus,
  MinorGuardianConsent,
} from './entities/minor-guardian-consent.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { EmailService } from '../user-management/email/email.service';
import { CacheService } from '../user-management/cache/cache.service';
import { SignupOrchestratorService } from '../user-management/auth/signup-orchestrator.service';
import { RelationshipType } from '../user-management/entities/guardian-account.entity';

describe('GuardianConsentService', () => {
  let service: GuardianConsentService;
  let consentRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let welperProfileRepo: { findOne: jest.Mock };
  let userRepo: { findOne: jest.Mock };
  let emailService: { sendGuardianReviewEmail: jest.Mock };
  let signupOrchestrator: { refreshWelperDiscoverability: jest.Mock };

  beforeEach(async () => {
    consentRepo = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    welperProfileRepo = { findOne: jest.fn() };
    userRepo = { findOne: jest.fn() };
    emailService = { sendGuardianReviewEmail: jest.fn().mockResolvedValue(undefined) };
    signupOrchestrator = { refreshWelperDiscoverability: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardianConsentService,
        { provide: getRepositoryToken(MinorGuardianConsent), useValue: consentRepo },
        { provide: getRepositoryToken(WelperProfile), useValue: welperProfileRepo },
        { provide: getRepositoryToken(UserAccount), useValue: userRepo },
        { provide: EmailService, useValue: emailService },
        { provide: CacheService, useValue: { get: jest.fn(), increment: jest.fn() } },
        { provide: SignupOrchestratorService, useValue: signupOrchestrator },
      ],
    }).compile();

    service = module.get(GuardianConsentService);
  });

  it('hasApprovedConsent returns true when status is approved', async () => {
    consentRepo.findOne.mockResolvedValue({
      status: GuardianConsentStatus.APPROVED,
    });
    await expect(service.hasApprovedConsent('minor-1')).resolves.toBe(true);
  });

  it('submitRequest sends email and stores pending consent', async () => {
    welperProfileRepo.findOne.mockResolvedValue({
      welperId: 'minor-1',
      dateOfBirth: '2010-06-01',
      firstName: 'Alex',
      lastName: 'Lee',
    });
    userRepo.findOne.mockResolvedValue({ id: 'minor-1', preferredLocale: 'en' });
    consentRepo.findOne.mockResolvedValue(null);

    await service.submitRequest('minor-1', {
      guardianFullName: 'Jane Lee',
      guardianEmail: 'jane@example.com',
      guardianPhone: '+14165551234',
      relationshipType: RelationshipType.PARENT,
    });

    expect(emailService.sendGuardianReviewEmail).toHaveBeenCalled();
    expect(consentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        minorUserId: 'minor-1',
        status: GuardianConsentStatus.PENDING,
        guardianEmail: 'jane@example.com',
      }),
    );
  });

  it('approveByToken marks consent approved and refreshes discoverability', async () => {
    const token = randomUUID();
    const consent: Partial<MinorGuardianConsent> = {
      minorUserId: 'minor-1',
      status: GuardianConsentStatus.PENDING,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      tokenExpiresAt: new Date(Date.now() + 60_000),
    };
    consentRepo.findOne.mockResolvedValue(consent);

    const result = await service.approveByToken(token, { ipAddress: '127.0.0.1' });

    expect(result.approved).toBe(true);
    expect(consent.status).toBe(GuardianConsentStatus.APPROVED);
    expect(signupOrchestrator.refreshWelperDiscoverability).toHaveBeenCalledWith('minor-1');
  });

  it('approveByToken rejects expired tokens', async () => {
    const token = randomUUID();
    consentRepo.findOne.mockResolvedValue({
      minorUserId: 'minor-1',
      status: GuardianConsentStatus.PENDING,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      tokenExpiresAt: new Date(Date.now() - 60_000),
    });

    await expect(service.approveByToken(token)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getReviewPreview keeps expired links readable after expiry', async () => {
    const token = randomUUID();
    const consent: Partial<MinorGuardianConsent> = {
      minorUserId: 'minor-1',
      status: GuardianConsentStatus.PENDING,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      tokenExpiresAt: new Date(Date.now() - 60_000),
      guardianFullName: 'Jane Lee',
      relationshipType: RelationshipType.PARENT,
    };
    consentRepo.findOne.mockResolvedValue(consent);
    welperProfileRepo.findOne.mockResolvedValue({
      welperId: 'minor-1',
      firstName: 'Alex',
      lastName: 'Lee',
    });

    const preview = await service.getReviewPreview(token);

    expect(preview.expired).toBe(true);
    expect(consent.status).toBe(GuardianConsentStatus.EXPIRED);
    expect(consent.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));

    const refreshed = await service.getReviewPreview(token);
    expect(refreshed.expired).toBe(true);
  });
});
