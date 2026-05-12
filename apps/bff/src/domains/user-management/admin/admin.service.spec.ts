import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UserAccount, AccountType, AccountStatus } from '../entities/user-account.entity';
import { VerificationStatus, BackgroundCheckStatus } from '../entities/verification-status.entity';
import { UsersService } from '../users/users.service';
import { EventPublisherService } from '../events/event-publisher.service';

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
});

