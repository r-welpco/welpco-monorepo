import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AccountLockoutService } from './account-lockout.service';
import { CacheService } from '../cache/cache.service';

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLockoutService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            increment: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountLockoutService>(AccountLockoutService);
    cacheService = module.get(CacheService);
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempts', async () => {
      cacheService.increment.mockResolvedValue(1);

      const attempts = await service.recordFailedAttempt('test@example.com');

      expect(cacheService.increment).toHaveBeenCalledWith(
        'account-lockout:test@example.com',
        900,
      );
      expect(attempts).toBe(1);
    });
  });

  describe('checkLockout', () => {
    it('should not throw if attempts below limit', async () => {
      cacheService.get.mockResolvedValue(3);

      await expect(service.checkLockout('test@example.com')).resolves.not.toThrow();
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      cacheService.get.mockResolvedValue(5);

      await expect(service.checkLockout('test@example.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('clearFailedAttempts', () => {
    it('should delete lockout key', async () => {
      cacheService.del.mockResolvedValue();

      await service.clearFailedAttempts('test@example.com');

      expect(cacheService.del).toHaveBeenCalledWith(
        'account-lockout:test@example.com',
      );
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return remaining attempts', async () => {
      cacheService.get.mockResolvedValue(2);

      const remaining = await service.getRemainingAttempts('test@example.com');

      expect(remaining).toBe(3); // 5 - 2 = 3
    });

    it('should return 0 if attempts exceed limit', async () => {
      cacheService.get.mockResolvedValue(6);

      const remaining = await service.getRemainingAttempts('test@example.com');

      expect(remaining).toBe(0);
    });
  });

  describe('isLocked', () => {
    it('should return true if account is locked', async () => {
      cacheService.get.mockResolvedValue(5);

      const isLocked = await service.isLocked('test@example.com');

      expect(isLocked).toBe(true);
    });

    it('should return false if account is not locked', async () => {
      cacheService.get.mockResolvedValue(3);

      const isLocked = await service.isLocked('test@example.com');

      expect(isLocked).toBe(false);
    });
  });
});

