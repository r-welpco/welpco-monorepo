import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  TooManyRequestsException,
} from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { UserAccount } from '../entities/user-account.entity';
import { CacheService } from '../cache/cache.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { EmailService } from '../email/email.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let userRepository: jest.Mocked<Repository<UserAccount>>;
  let cacheService: jest.Mocked<CacheService>;
  let eventPublisher: jest.Mocked<EventPublisherService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser: UserAccount = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'old-hash',
    authVersion: 0,
  } as UserAccount;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            increment: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: {
            publishPasswordResetRequested: jest.fn(),
            publishPasswordResetCompleted: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    userRepository = module.get(getRepositoryToken(UserAccount));
    cacheService = module.get(CacheService);
    eventPublisher = module.get(EventPublisherService);
    emailService = module.get(EmailService);
  });

  describe('requestPasswordReset', () => {
    it('should generate reset token and await email/event dispatch for known email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      cacheService.get.mockResolvedValue(0);
      cacheService.set.mockResolvedValue();
      cacheService.increment.mockResolvedValue(1);
      emailService.sendPasswordResetEmail.mockResolvedValue();
      eventPublisher.publishPasswordResetRequested.mockResolvedValue();

      await service.requestPasswordReset('  Test@Example.com  ');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(cacheService.set).toHaveBeenCalled();
      expect(cacheService.increment).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
        mockUser.preferredLocale,
      );
      expect(eventPublisher.publishPasswordResetRequested).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);

      expect(cacheService.set).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(eventPublisher.publishPasswordResetRequested).not.toHaveBeenCalled();
    });

    it('should throw TooManyRequestsException after 5 reset requests per hour', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      cacheService.get.mockResolvedValue(5);

      await expect(
        service.requestPasswordReset('test@example.com'),
      ).rejects.toThrow(TooManyRequestsException);

      expect(cacheService.set).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(eventPublisher.publishPasswordResetRequested).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    it('should reset password successfully', async () => {
      const token = 'reset-token';
      cacheService.get.mockResolvedValue('user-1');
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hash',
      });
      cacheService.del.mockResolvedValue();
      eventPublisher.publishPasswordResetCompleted.mockResolvedValue();

      // Mock bcrypt
      jest.mock('bcrypt', () => ({
        hash: jest.fn().mockResolvedValue('new-hash'),
      }));

      await service.confirmPasswordReset(token, 'NewPassword123!');

      expect(cacheService.get).toHaveBeenCalledWith(
        `password-reset:token:${token}`,
      );
      expect(userRepository.save).toHaveBeenCalled();
      expect(mockUser.authVersion).toBe(1);
      expect(cacheService.del).toHaveBeenCalled();
      expect(eventPublisher.publishPasswordResetCompleted).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      cacheService.get.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset('invalid-token', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      cacheService.get.mockResolvedValue('user-1');
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset('valid-token', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
