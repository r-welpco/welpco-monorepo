import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralCode, CodeType } from '../entities/referral-code.entity';
import { Referral, ReferralStatus } from '../entities/referral.entity';
import { UserAccount } from '../entities/user-account.entity';
import { EventPublisherService } from '../events/event-publisher.service';

describe('ReferralService', () => {
  let service: ReferralService;
  let referralCodeRepository: Repository<ReferralCode>;
  let referralRepository: Repository<Referral>;
  let userRepository: Repository<UserAccount>;
  let eventPublisher: EventPublisherService;

  const mockReferralCodeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockReferralRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockEventPublisher = {
    publishReferralCodeGenerated: jest.fn(),
    publishReferralCreated: jest.fn(),
    publishReferralCompleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: getRepositoryToken(ReferralCode),
          useValue: mockReferralCodeRepository,
        },
        {
          provide: getRepositoryToken(Referral),
          useValue: mockReferralRepository,
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserRepository,
        },
        {
          provide: EventPublisherService,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    referralCodeRepository = module.get<Repository<ReferralCode>>(getRepositoryToken(ReferralCode));
    referralRepository = module.get<Repository<Referral>>(getRepositoryToken(Referral));
    userRepository = module.get<Repository<UserAccount>>(getRepositoryToken(UserAccount));
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReferralCode', () => {
    const userId = 'user-id';

    it('should return existing code if user already has one', async () => {
      const existingCode = {
        id: 'code-id',
        userId,
        code: 'EXISTING',
        isActive: true,
      };
      mockReferralCodeRepository.findOne.mockResolvedValue(existingCode);

      const result = await service.generateReferralCode(userId);

      expect(mockReferralCodeRepository.findOne).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
      expect(result).toEqual(existingCode);
      expect(mockReferralCodeRepository.create).not.toHaveBeenCalled();
    });

    it('should generate new referral code if user does not have one', async () => {
      mockReferralCodeRepository.findOne.mockResolvedValue(null);
      const newCode = {
        id: 'code-id',
        userId,
        code: 'NEWCODE123',
        codeType: CodeType.PERSONAL,
        isActive: true,
      };
      mockReferralCodeRepository.create.mockReturnValue(newCode);
      mockReferralCodeRepository.save.mockResolvedValue(newCode);
      mockEventPublisher.publishReferralCodeGenerated.mockResolvedValue(undefined);

      const result = await service.generateReferralCode(userId);

      expect(mockReferralCodeRepository.findOne).toHaveBeenCalled();
      expect(mockReferralCodeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          codeType: CodeType.PERSONAL,
          isActive: true,
        }),
      );
      expect(mockReferralCodeRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishReferralCodeGenerated).toHaveBeenCalled();
      expect(result.code).toBeDefined();
    });
  });

  describe('getReferralCode', () => {
    const userId = 'user-id';

    it('should return referral code if found', async () => {
      const code = {
        id: 'code-id',
        userId,
        code: 'TESTCODE',
        isActive: true,
      };
      mockReferralCodeRepository.findOne.mockResolvedValue(code);

      const result = await service.getReferralCode(userId);

      expect(mockReferralCodeRepository.findOne).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
      expect(result).toEqual(code);
    });

    it('should return null if no code found', async () => {
      mockReferralCodeRepository.findOne.mockResolvedValue(null);

      const result = await service.getReferralCode(userId);

      expect(result).toBeNull();
    });
  });

  describe('applyReferralCode', () => {
    const code = 'REFERRAL123';
    const newUserId = 'new-user-id';
    const referrerUserId = 'referrer-user-id';

    it('should successfully apply referral code', async () => {
      const referralCode = {
        id: 'code-id',
        userId: referrerUserId,
        code,
        isActive: true,
        expiresAt: null,
      };
      const referral = {
        id: 'referral-id',
        referrerUserId,
        refereeUserId: newUserId,
        referralCodeId: referralCode.id,
        status: ReferralStatus.PENDING,
      };

      mockReferralCodeRepository.findOne.mockResolvedValue(referralCode);
      mockReferralRepository.findOne.mockResolvedValue(null);
      mockReferralRepository.create.mockReturnValue(referral);
      mockReferralRepository.save.mockResolvedValue(referral);
      mockEventPublisher.publishReferralCreated.mockResolvedValue(undefined);

      const result = await service.applyReferralCode(code, newUserId);

      expect(mockReferralCodeRepository.findOne).toHaveBeenCalledWith({
        where: { code, isActive: true },
      });
      expect(mockReferralRepository.findOne).toHaveBeenCalledWith({
        where: {
          referrerUserId,
          refereeUserId: newUserId,
        },
      });
      expect(mockReferralRepository.create).toHaveBeenCalled();
      expect(mockReferralRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishReferralCreated).toHaveBeenCalled();
      expect(result).toEqual(referral);
    });

    it('should throw NotFoundException if referral code not found', async () => {
      mockReferralCodeRepository.findOne.mockResolvedValue(null);

      await expect(service.applyReferralCode(code, newUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if referral code is expired', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      const referralCode = {
        id: 'code-id',
        userId: referrerUserId,
        code,
        isActive: true,
        expiresAt: expiredDate,
      };

      mockReferralCodeRepository.findOne.mockResolvedValue(referralCode);

      await expect(service.applyReferralCode(code, newUserId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user tries to use own code', async () => {
      const referralCode = {
        id: 'code-id',
        userId: newUserId, // Same as newUserId
        code,
        isActive: true,
        expiresAt: null,
      };

      mockReferralCodeRepository.findOne.mockResolvedValue(referralCode);

      await expect(service.applyReferralCode(code, newUserId)).rejects.toThrow(BadRequestException);
    });

    it('should return existing referral if already applied', async () => {
      const referralCode = {
        id: 'code-id',
        userId: referrerUserId,
        code,
        isActive: true,
        expiresAt: null,
      };
      const existingReferral = {
        id: 'existing-referral-id',
        referrerUserId,
        refereeUserId: newUserId,
      };

      mockReferralCodeRepository.findOne.mockResolvedValue(referralCode);
      mockReferralRepository.findOne.mockResolvedValue(existingReferral);

      const result = await service.applyReferralCode(code, newUserId);

      expect(result).toEqual(existingReferral);
      expect(mockReferralRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getReferralHistory', () => {
    const userId = 'user-id';

    it('should return referral history', async () => {
      const referrals = [
        {
          id: 'ref-1',
          referrerUserId: userId,
          refereeUserId: 'other-user',
          status: ReferralStatus.PENDING,
        },
        {
          id: 'ref-2',
          refereeUserId: userId,
          referrerUserId: 'another-user',
          status: ReferralStatus.COMPLETED,
        },
      ];
      mockReferralRepository.find.mockResolvedValue(referrals);

      const result = await service.getReferralHistory(userId);

      expect(mockReferralRepository.find).toHaveBeenCalledWith({
        where: [{ referrerUserId: userId }, { refereeUserId: userId }],
        relations: ['referrer', 'referee', 'referralCode'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(referrals);
    });

    it('should return empty array if no referrals found', async () => {
      mockReferralRepository.find.mockResolvedValue([]);

      const result = await service.getReferralHistory(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getReferralStats', () => {
    const userId = 'user-id';

    it('should calculate referral statistics correctly', async () => {
      const referrals = [
        {
          id: 'ref-1',
          referrerUserId: userId,
          status: ReferralStatus.COMPLETED,
          rewardAmount: 10.0,
        },
        {
          id: 'ref-2',
          referrerUserId: userId,
          status: ReferralStatus.PENDING,
          rewardAmount: 0,
        },
        {
          id: 'ref-3',
          referrerUserId: userId,
          status: ReferralStatus.COMPLETED,
          rewardAmount: 15.0,
        },
      ];
      mockReferralRepository.find.mockResolvedValue(referrals);

      const result = await service.getReferralStats(userId);

      expect(result.totalReferrals).toBe(3);
      expect(result.completedReferrals).toBe(2);
      expect(result.pendingReferrals).toBe(1);
      expect(result.totalRewards).toBe(25.0);
    });
  });

  describe('completeReferral', () => {
    const referralId = 'referral-id';

    it('should successfully complete referral', async () => {
      const referral = {
        id: referralId,
        referrerUserId: 'referrer-id',
        refereeUserId: 'referee-id',
        status: ReferralStatus.PENDING,
        completionDate: null,
      };
      const completedReferral = {
        ...referral,
        status: ReferralStatus.COMPLETED,
        completionDate: new Date(),
      };

      mockReferralRepository.findOne.mockResolvedValue(referral);
      mockReferralRepository.save.mockResolvedValue(completedReferral);
      mockEventPublisher.publishReferralCompleted.mockResolvedValue(undefined);

      const result = await service.completeReferral(referralId);

      expect(mockReferralRepository.findOne).toHaveBeenCalledWith({
        where: { id: referralId },
      });
      expect(mockReferralRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishReferralCompleted).toHaveBeenCalled();
      expect(result.status).toBe(ReferralStatus.COMPLETED);
    });

    it('should throw NotFoundException if referral not found', async () => {
      mockReferralRepository.findOne.mockResolvedValue(null);

      await expect(service.completeReferral(referralId)).rejects.toThrow(NotFoundException);
    });

    it('should return referral if already completed', async () => {
      const referral = {
        id: referralId,
        status: ReferralStatus.COMPLETED,
        completionDate: new Date(),
      };

      mockReferralRepository.findOne.mockResolvedValue(referral);

      const result = await service.completeReferral(referralId);

      expect(result).toEqual(referral);
      expect(mockReferralRepository.save).not.toHaveBeenCalled();
    });
  });
});

