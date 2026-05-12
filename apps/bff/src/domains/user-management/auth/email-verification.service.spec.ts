import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { UserAccount, AccountType, AccountStatus } from '../entities/user-account.entity';
import { VerificationStatus } from '../entities/verification-status.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { EmailService } from '../email/email.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let tokenRepository: jest.Mocked<Repository<EmailVerificationToken>>;
  let userRepository: jest.Mocked<Repository<UserAccount>>;
  let verificationRepository: jest.Mocked<Repository<VerificationStatus>>;
  let eventPublisher: jest.Mocked<EventPublisherService>;

  const mockUser: UserAccount = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hash',
    accountType: AccountType.CUSTOMER,
    status: AccountStatus.PENDING,
    emailVerified: false,
  } as UserAccount;

  const mockToken: EmailVerificationToken = {
    id: 'token-1',
    userId: 'user-1',
    token: 'test-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    usedAt: null,
    user: mockUser,
    isExpired: () => false,
    isUsed: () => false,
  } as EmailVerificationToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: getRepositoryToken(EmailVerificationToken),
          useValue: {
            delete: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
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
          provide: EventPublisherService,
          useValue: {
            publishEmailVerificationRequested: jest.fn(),
            publishEmailVerified: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
    tokenRepository = module.get(getRepositoryToken(EmailVerificationToken));
    userRepository = module.get(getRepositoryToken(UserAccount));
    verificationRepository = module.get(getRepositoryToken(VerificationStatus));
    eventPublisher = module.get(EventPublisherService);
  });

  describe('generateVerificationToken', () => {
    it('should generate and save verification token', async () => {
      tokenRepository.delete.mockResolvedValue({} as any);
      tokenRepository.create.mockReturnValue(mockToken);
      tokenRepository.save.mockResolvedValue(mockToken);
      userRepository.findOne.mockResolvedValue(mockUser);
      eventPublisher.publishEmailVerificationRequested.mockResolvedValue();

      const token = await service.generateVerificationToken('user-1');

      expect(tokenRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
        usedAt: IsNull(),
      });
      expect(tokenRepository.create).toHaveBeenCalled();
      expect(tokenRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publishEmailVerificationRequested).toHaveBeenCalled();
      expect(token).toBeDefined();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      tokenRepository.findOne.mockResolvedValue(mockToken);
      userRepository.save.mockResolvedValue({ ...mockUser, emailVerified: true });
      verificationRepository.findOne.mockResolvedValue(null);
      verificationRepository.create.mockReturnValue({
        userId: 'user-1',
        emailVerified: true,
      } as VerificationStatus);
      verificationRepository.save.mockResolvedValue({} as VerificationStatus);
      eventPublisher.publishEmailVerified.mockResolvedValue();

      await service.verifyEmail('test-token');

      expect(tokenRepository.findOne).toHaveBeenCalledWith({
        where: { token: 'test-token' },
        relations: ['user'],
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publishEmailVerified).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid token', async () => {
      tokenRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for used token', async () => {
      const usedToken = { ...mockToken, usedAt: new Date(), isUsed: () => true };
      tokenRepository.findOne.mockResolvedValue(usedToken as any);

      await expect(service.verifyEmail('test-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000),
        isExpired: () => true,
      };
      tokenRepository.findOne.mockResolvedValue(expiredToken as any);

      await expect(service.verifyEmail('test-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should auto-activate customer account after verification', async () => {
      const customerUser = { ...mockUser, accountType: AccountType.CUSTOMER };
      const customerToken = { ...mockToken, user: customerUser };
      tokenRepository.findOne.mockResolvedValue(customerToken as any);
      userRepository.save.mockResolvedValue({
        ...customerUser,
        emailVerified: true,
        status: AccountStatus.ACTIVE,
      });
      verificationRepository.findOne.mockResolvedValue(null);
      verificationRepository.create.mockReturnValue({} as VerificationStatus);
      verificationRepository.save.mockResolvedValue({} as VerificationStatus);
      eventPublisher.publishEmailVerified.mockResolvedValue();

      await service.verifyEmail('test-token');

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AccountStatus.ACTIVE,
          emailVerified: true,
        }),
      );
    });

    // Day 9 — Auth functional audit: cross-account collision defense
    it('should reject when email arg does not match the token owner', async () => {
      // The token row is for `mockUser` (test@example.com). Caller passes a
      // DIFFERENT email — simulating either a 6-digit code collision or a
      // brute-force hit against another user's active code. We must NOT
      // verify any account in this case, and the response must be
      // indistinguishable from a missing-token (NotFoundException, not a
      // BadRequest leaking "this code exists for a different user").
      tokenRepository.findOne.mockResolvedValue(mockToken);

      await expect(
        service.verifyEmail('test-token', 'attacker@example.com'),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventPublisher.publishEmailVerified).not.toHaveBeenCalled();
    });

    it('should accept when email arg matches the token owner (case + whitespace insensitive)', async () => {
      tokenRepository.findOne.mockResolvedValue(mockToken);
      userRepository.save.mockResolvedValue({ ...mockUser, emailVerified: true });
      verificationRepository.findOne.mockResolvedValue(null);
      verificationRepository.create.mockReturnValue({
        userId: 'user-1',
        emailVerified: true,
      } as VerificationStatus);
      verificationRepository.save.mockResolvedValue({} as VerificationStatus);
      eventPublisher.publishEmailVerified.mockResolvedValue();

      // Whitespace + case-folded match should succeed (defends against
      // legitimate casing differences, e.g. iOS auto-capitalised email).
      await service.verifyEmail('test-token', '  TEST@example.com ');

      expect(userRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publishEmailVerified).toHaveBeenCalled();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      userRepository.findOne.mockResolvedValue(unverifiedUser);
      tokenRepository.delete.mockResolvedValue({} as any);
      tokenRepository.create.mockReturnValue(mockToken);
      tokenRepository.save.mockResolvedValue(mockToken);
      eventPublisher.publishEmailVerificationRequested.mockResolvedValue();

      await service.resendVerificationEmail('user-1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(tokenRepository.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.resendVerificationEmail('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if email already verified', async () => {
      const verifiedUser = { ...mockUser, emailVerified: true };
      userRepository.findOne.mockResolvedValue(verifiedUser);

      await expect(service.resendVerificationEmail('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

