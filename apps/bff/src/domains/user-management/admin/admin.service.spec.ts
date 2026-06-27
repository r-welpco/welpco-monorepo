import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UserAccount, AccountType, AccountStatus } from '../entities/user-account.entity';
import { VerificationStatus, BackgroundCheckStatus } from '../entities/verification-status.entity';
import { UsersService } from '../users/users.service';
import { EventPublisherService } from '../events/event-publisher.service';
import {
  CustomerProfile,
  ServiceOffering,
  WelperProfile,
} from '../../profile-management/entities';
import { Review } from '../../review/entities/review.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { ReferralCode } from '../entities/referral-code.entity';
import { Referral } from '../entities/referral.entity';
import { BackgroundCheckOrder } from '../../safety-verification/entities/background-check-order.entity';
import { BackgroundCheckService } from '../../safety-verification/background-check.service';
import { SignupOrchestratorService } from '../auth/signup-orchestrator.service';

function createQueryBuilderMock() {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };
}

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: jest.Mocked<Repository<UserAccount>>;
  let verificationRepository: jest.Mocked<Repository<VerificationStatus>>;
  let usersService: jest.Mocked<UsersService>;
  let eventPublisher: jest.Mocked<EventPublisherService>;

  const mockWelper: UserAccount = {
    id: 'welper-1',
    email: 'welper@example.com',
    accountType: AccountType.WELPER,
    status: AccountStatus.PENDING,
    emailVerified: true,
  } as UserAccount;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: {
            createQueryBuilder: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(VerificationStatus),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        ...[
          CustomerProfile,
          WelperProfile,
          ServiceOffering,
          Review,
          Notification,
          ReferralCode,
          Referral,
          BackgroundCheckOrder,
        ].map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: {},
        })),
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: {},
        },
        {
          provide: BackgroundCheckService,
          useValue: {},
        },
        {
          provide: SignupOrchestratorService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get(getRepositoryToken(UserAccount));
    verificationRepository = module.get(getRepositoryToken(VerificationStatus));
    usersService = module.get(UsersService);
    eventPublisher = module.get(EventPublisherService);
  });

  describe('setBackgroundCheckStatus', () => {
    it('should set background check status for Welper', async () => {
      usersService.findById.mockResolvedValue(mockWelper);
      verificationRepository.findOne.mockResolvedValue(null);
      verificationRepository.create.mockReturnValue({
        userId: 'welper-1',
        backgroundCheckStatus: BackgroundCheckStatus.PASSED,
      } as VerificationStatus);
      verificationRepository.save.mockResolvedValue({
        userId: 'welper-1',
        backgroundCheckStatus: BackgroundCheckStatus.PASSED,
      } as VerificationStatus);
      usersService.updateStatus.mockResolvedValue({
        ...mockWelper,
        status: AccountStatus.ACTIVE,
      });

      const result = await service.setBackgroundCheckStatus(
        'welper-1',
        BackgroundCheckStatus.PASSED,
      );

      expect(usersService.findById).toHaveBeenCalledWith('welper-1');
      expect(verificationRepository.save).toHaveBeenCalled();
      expect(result.backgroundCheckStatus).toBe(BackgroundCheckStatus.PASSED);
    });

    it('should auto-activate Welper when background check passes', async () => {
      usersService.findById.mockResolvedValue(mockWelper);
      verificationRepository.findOne.mockResolvedValue(null);
      verificationRepository.create.mockReturnValue({} as VerificationStatus);
      verificationRepository.save.mockResolvedValue({
        backgroundCheckStatus: BackgroundCheckStatus.PASSED,
      } as VerificationStatus);
      usersService.updateStatus.mockResolvedValue({
        ...mockWelper,
        status: AccountStatus.ACTIVE,
      });

      await service.setBackgroundCheckStatus(
        'welper-1',
        BackgroundCheckStatus.PASSED,
      );

      expect(usersService.updateStatus).toHaveBeenCalledWith(
        'welper-1',
        AccountStatus.ACTIVE,
      );
    });

    it('should throw BadRequestException for non-Welper accounts', async () => {
      const customer = { ...mockWelper, accountType: AccountType.CUSTOMER };
      usersService.findById.mockResolvedValue(customer);

      await expect(
        service.setBackgroundCheckStatus(
          'customer-1',
          BackgroundCheckStatus.PASSED,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWelperDistributionReport', () => {
    it('returns aggregate buckets without user identifiers or individual coordinates', async () => {
      const summaryQb = createQueryBuilderMock();
      const bucketsQb = createQueryBuilderMock();
      userRepository.createQueryBuilder
        .mockReturnValueOnce(summaryQb as any)
        .mockReturnValueOnce(bucketsQb as any);

      summaryQb.getRawOne.mockResolvedValue({
        total: '3',
        active: '2',
        discoverable: '1',
        signupIncomplete: '1',
        pendingBackgroundCheck: '1',
        missingCoordinates: '1',
      });
      bucketsQb.getRawMany.mockResolvedValue([
        {
          city: 'Toronto',
          provinceCode: 'ON',
          countryCode: 'CA',
          welperCount: '3',
          activeCount: '2',
          discoverableCount: '1',
          signupIncompleteCount: '1',
          pendingBackgroundCheckCount: '1',
          missingCoordinateCount: '1',
          latitude: '43.65',
          longitude: '-79.38',
          pendingStatusCount: '1',
          activeStatusCount: '2',
          suspendedStatusCount: '0',
          deactivatedStatusCount: '0',
        },
      ]);

      const report = await service.getWelperDistributionReport({
        scope: 'all',
        city: 'Toronto',
        provinceCode: 'on',
      });

      expect(report.summary).toEqual({
        total: 3,
        active: 2,
        discoverable: 1,
        signupIncomplete: 1,
        pendingBackgroundCheck: 1,
        missingCoordinates: 1,
      });
      expect(report.buckets).toEqual([
        {
          city: 'Toronto',
          provinceCode: 'ON',
          countryCode: 'CA',
          welperCount: 3,
          activeCount: 2,
          discoverableCount: 1,
          signupIncompleteCount: 1,
          pendingBackgroundCheckCount: 1,
          missingCoordinateCount: 1,
          latitude: 43.65,
          longitude: -79.38,
          statusBreakdown: {
            [AccountStatus.PENDING]: 1,
            [AccountStatus.ACTIVE]: 2,
            [AccountStatus.SUSPENDED]: 0,
            [AccountStatus.DEACTIVATED]: 0,
          },
        },
      ]);
      expect(Object.keys(report.buckets[0])).not.toContain('id');
      expect(Object.keys(report.buckets[0])).not.toContain('welperId');
    });

    it('defaults to discoverable welpers', async () => {
      const summaryQb = createQueryBuilderMock();
      const bucketsQb = createQueryBuilderMock();
      userRepository.createQueryBuilder
        .mockReturnValueOnce(summaryQb as any)
        .mockReturnValueOnce(bucketsQb as any);
      summaryQb.getRawOne.mockResolvedValue({});
      bucketsQb.getRawMany.mockResolvedValue([]);

      const report = await service.getWelperDistributionReport();

      expect(report.scope).toBe('discoverable');
      expect(
        summaryQb.andWhere.mock.calls.some(([sql]) =>
          String(sql).includes('user.signup_completed = true'),
        ),
      ).toBe(true);
      expect(
        summaryQb.andWhere.mock.calls.some(([sql]) =>
          String(sql).includes('welper_profile.profile_visibility = :publicVisibility'),
        ),
      ).toBe(true);
    });
  });
});
