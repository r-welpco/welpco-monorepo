import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserAccount, AccountType, AccountStatus } from '../entities/user-account.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<UserAccount>;
  let eventPublisher: EventPublisherService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockEventPublisher = {
    publishAccountStatusChanged: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
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

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<UserAccount>>(getRepositoryToken(UserAccount));
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    const userId = 'user-id';

    it('should return user if found', async () => {
      const user = {
        id: userId,
        email: 'user@example.com',
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    const email = 'user@example.com';

    it('should return user if found', async () => {
      const user = {
        id: 'user-id',
        email,
        accountType: AccountType.CUSTOMER,
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('updateAccount', () => {
    const userId = 'user-id';
    const updateDto: UpdateUserDto = { email: 'newemail@example.com' };

    it('should successfully update user account', async () => {
      const existingUser = {
        id: userId,
        email: 'oldemail@example.com',
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
      };
      const updatedUser = { ...existingUser, email: updateDto.email };

      mockUserRepository.findOne
        .mockResolvedValueOnce(existingUser) // findById call
        .mockResolvedValueOnce(null); // findByEmail check (no conflict)
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateAccount(userId, updateDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: updateDto.email } });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(updateDto.email);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateAccount(userId, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if email is already in use by another user', async () => {
      const existingUser = {
        id: userId,
        email: 'oldemail@example.com',
      };
      const conflictingUser = {
        id: 'other-user-id',
        email: updateDto.email,
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(existingUser) // findById call
        .mockResolvedValueOnce(conflictingUser); // findByEmail check (conflict found)

      await expect(service.updateAccount(userId, updateDto)).rejects.toThrow(ForbiddenException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should allow updating to same email', async () => {
      const existingUser = {
        id: userId,
        email: updateDto.email,
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(existingUser) // findById call
        .mockResolvedValueOnce(existingUser); // findByEmail check (same user)
      mockUserRepository.save.mockResolvedValue(existingUser);

      const result = await service.updateAccount(userId, updateDto);

      expect(result).toEqual(existingUser);
    });
  });

  describe('deleteAccount', () => {
    const userId = 'user-id';

    it('should successfully deactivate user account', async () => {
      const user = {
        id: userId,
        email: 'user@example.com',
        status: AccountStatus.ACTIVE,
      };
      const deactivatedUser = { ...user, status: AccountStatus.DEACTIVATED };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(deactivatedUser);
      mockEventPublisher.publishAccountStatusChanged.mockResolvedValue(undefined);

      await service.deleteAccount(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AccountStatus.DEACTIVATED }),
      );
      expect(mockEventPublisher.publishAccountStatusChanged).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    const userId = 'user-id';

    it('should successfully update user status', async () => {
      const user = {
        id: userId,
        email: 'user@example.com',
        status: AccountStatus.PENDING,
      };
      const updatedUser = { ...user, status: AccountStatus.ACTIVE };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(updatedUser);
      mockEventPublisher.publishAccountStatusChanged.mockResolvedValue(undefined);

      const result = await service.updateStatus(userId, AccountStatus.ACTIVE);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishAccountStatusChanged).toHaveBeenCalled();
      expect(result.status).toBe(AccountStatus.ACTIVE);
    });
  });

  // Note: markOnboardingComplete has been moved to Profile Management domain
  // These tests are no longer applicable to User Management service
});

