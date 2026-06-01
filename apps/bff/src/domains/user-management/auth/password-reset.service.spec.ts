import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
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

  const mockUser: UserAccount = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'old-hash',
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
  });

  describe('requestPasswordReset', () => {
    it('should generate reset token (and dispatch email/event out-of-band) for known email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      cacheService.get.mockResolvedValue(0);
      cacheService.set.mockResolvedValue();
      cacheService.increment.mockResolvedValue(1);
      eventPublisher.publishPasswordResetRequested.mockResolvedValue();

      await service.requestPasswordReset('  Test@Example.com  ');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(cacheService.set).toHaveBeenCalled();
      expect(cacheService.increment).toHaveBeenCalled();
      // Email + event are fire-and-forget; await a microtask flush so the
      // void-returning dispatch can run before assertions.
      await new Promise((r) => setImmediate(r));
      expect(eventPublisher.publishPasswordResetRequested).toHaveBeenCalled();
    });

    it('should return silently for unknown email (Wave 2: enumeration-safe)', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('nonexistent@example.com'),
      ).resolves.toBeUndefined();

      expect(cacheService.set).not.toHaveBeenCalled();
      expect(eventPublisher.publishPasswordResetRequested).not.toHaveBeenCalled();
    });

    it('Wave 2: rate-limited known account also returns silently (no thrown error)', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      cacheService.get.mockResolvedValue(3);

      await expect(
        service.requestPasswordReset('test@example.com'),
      ).resolves.toBeUndefined();

      // Crucially: no token mint, no email send, no event publish — but no
      // BadRequest either, so the response shape stays uniform with the
      // unknown-email path.
      expect(cacheService.set).not.toHaveBeenCalled();
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

