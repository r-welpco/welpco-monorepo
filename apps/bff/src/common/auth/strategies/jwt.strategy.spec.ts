import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';
import {
  AccountStatus,
  AccountType,
  UserAccount,
} from '../../../domains/user-management/entities/user-account.entity';

function requestWithRoleHeader(role?: string): Request {
  return {
    headers: role === undefined ? {} : { 'x-welpco-role': role },
  } as unknown as Request;
}

describe('JwtStrategy', () => {
  const config = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const repository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<UserAccount>>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(config, repository);
  });

  it('builds the principal from current database state', async () => {
    repository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'current@example.com',
      accountType: AccountType.WELPER,
      status: AccountStatus.ACTIVE,
      signupCompleted: true,
      authVersion: 3,
    } as UserAccount);

    await expect(
      strategy.validate(requestWithRoleHeader(), {
        sub: 'user-1',
        email: 'stale@example.com',
        accountType: AccountType.CUSTOMER,
        authVersion: 3,
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'current@example.com',
      accountType: AccountType.WELPER,
      effectiveRole: 'welper',
      signupCompleted: true,
    });
  });

  describe('role mode header (dual-role accounts)', () => {
    const welperAccount = {
      id: 'user-1',
      email: 'welper@example.com',
      accountType: AccountType.WELPER,
      status: AccountStatus.ACTIVE,
      signupCompleted: true,
      authVersion: 0,
    } as UserAccount;
    const welperPayload = {
      sub: 'user-1',
      email: 'welper@example.com',
      accountType: AccountType.WELPER,
      authVersion: 0,
    };

    it('downgrades a welper to customer mode when requested', async () => {
      repository.findOne.mockResolvedValue(welperAccount);

      await expect(
        strategy.validate(requestWithRoleHeader('customer'), welperPayload),
      ).resolves.toMatchObject({ effectiveRole: 'customer' });
    });

    it('ignores case in the requested role', async () => {
      repository.findOne.mockResolvedValue(welperAccount);

      await expect(
        strategy.validate(requestWithRoleHeader('Customer'), welperPayload),
      ).resolves.toMatchObject({ effectiveRole: 'customer' });
    });

    it('ignores an unknown header value', async () => {
      repository.findOne.mockResolvedValue(welperAccount);

      await expect(
        strategy.validate(requestWithRoleHeader('admin'), welperPayload),
      ).resolves.toMatchObject({ effectiveRole: 'welper' });
    });

    it('never elevates a customer to welper', async () => {
      repository.findOne.mockResolvedValue({
        ...welperAccount,
        accountType: AccountType.CUSTOMER,
      } as UserAccount);

      await expect(
        strategy.validate(requestWithRoleHeader('welper'), {
          ...welperPayload,
          accountType: AccountType.CUSTOMER,
        }),
      ).resolves.toMatchObject({ effectiveRole: 'customer' });
    });

    it('never downgrades an admin', async () => {
      repository.findOne.mockResolvedValue({
        ...welperAccount,
        accountType: AccountType.ADMIN,
      } as UserAccount);

      await expect(
        strategy.validate(requestWithRoleHeader('customer'), {
          ...welperPayload,
          accountType: AccountType.ADMIN,
        }),
      ).resolves.toMatchObject({ effectiveRole: 'admin' });
    });
  });

  it.each([AccountStatus.SUSPENDED, AccountStatus.DEACTIVATED])(
    'rejects %s accounts',
    async (status) => {
      repository.findOne.mockResolvedValue({
        id: 'user-1',
        accountType: AccountType.CUSTOMER,
        status,
        authVersion: 0,
      } as UserAccount);

      await expect(
        strategy.validate(requestWithRoleHeader(), {
          sub: 'user-1',
          email: 'user@example.com',
          accountType: AccountType.CUSTOMER,
          authVersion: 0,
        }),
      ).rejects.toThrow(UnauthorizedException);
    },
  );

  it('rejects deleted accounts and revoked sessions', async () => {
    repository.findOne.mockResolvedValueOnce(null);
    await expect(
      strategy.validate(requestWithRoleHeader(), {
        sub: 'user-1',
        email: 'user@example.com',
        accountType: AccountType.CUSTOMER,
      }),
    ).rejects.toThrow(UnauthorizedException);

    repository.findOne.mockResolvedValueOnce({
      id: 'user-1',
      accountType: AccountType.CUSTOMER,
      status: AccountStatus.ACTIVE,
      authVersion: 2,
    } as UserAccount);
    await expect(
      strategy.validate(requestWithRoleHeader(), {
        sub: 'user-1',
        email: 'user@example.com',
        accountType: AccountType.CUSTOMER,
        authVersion: 1,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects pending admin accounts', async () => {
    repository.findOne.mockResolvedValue({
      id: 'admin-1',
      accountType: AccountType.ADMIN,
      status: AccountStatus.PENDING,
      authVersion: 0,
    } as UserAccount);

    await expect(
      strategy.validate(requestWithRoleHeader(), {
        sub: 'admin-1',
        email: 'admin@example.com',
        accountType: AccountType.ADMIN,
        authVersion: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
