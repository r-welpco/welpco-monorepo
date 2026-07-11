import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, HttpException, NotFoundException } from '@nestjs/common';
import { HandleService } from './handle.service';
import { WelperProfile } from '../entities/welper-profile.entity';
import { RESERVED_HANDLES } from './handle.constants';

/** Capture the thrown/rejected error so we can assert the typed `{ code }` body. */
function catchSync(fn: () => unknown): unknown {
  try {
    fn();
    return undefined;
  } catch (err) {
    return err;
  }
}

function errorCode(err: unknown): string | undefined {
  if (err instanceof HttpException) {
    const response = err.getResponse();
    if (typeof response === 'object' && response !== null) {
      return (response as { code?: string }).code;
    }
  }
  return undefined;
}

describe('HandleService', () => {
  let service: HandleService;

  const mockWelperProfileRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleService,
        {
          provide: getRepositoryToken(WelperProfile),
          useValue: mockWelperProfileRepo,
        },
      ],
    }).compile();

    service = module.get<HandleService>(HandleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeAndValidate (regex + reserved words)', () => {
    it.each(['marie-m', 'abc', 'a1b', '0start', 'thirty-chars-handle-is-okay-yy'])(
      'accepts valid handle "%s"',
      (handle) => {
        expect(service.normalizeAndValidate(handle)).toBe(handle);
      },
    );

    it('normalizes case and surrounding whitespace', () => {
      expect(service.normalizeAndValidate('  Marie-M  ')).toBe('marie-m');
    });

    it.each([
      'ab', // too short (min 3)
      '-starts-with-hyphen',
      'has spaces',
      'émile', // non-ascii
      'under_score',
      'a'.repeat(31), // too long (max 30)
      '',
    ])('rejects invalid handle "%s" with INVALID_HANDLE', (handle) => {
      const err = catchSync(() => service.normalizeAndValidate(handle));
      expect(err).toBeInstanceOf(BadRequestException);
      expect(errorCode(err)).toBe('INVALID_HANDLE');
    });

    it.each([...RESERVED_HANDLES].filter((h) => h.length >= 3))(
      'rejects reserved handle "%s" with HANDLE_RESERVED',
      (handle) => {
        const err = catchSync(() => service.normalizeAndValidate(handle));
        expect(err).toBeInstanceOf(ConflictException);
        expect(errorCode(err)).toBe('HANDLE_RESERVED');
      },
    );

    it('rejects the short reserved handle "w" as invalid (regex fails first)', () => {
      const err = catchSync(() => service.normalizeAndValidate('w'));
      expect(err).toBeInstanceOf(BadRequestException);
    });
  });

  describe('claimHandle', () => {
    const profile = (overrides: Partial<WelperProfile> = {}) =>
      ({ welperId: 'welper-1', handle: null, ...overrides }) as WelperProfile;

    it('claims a free handle (lowercased)', async () => {
      mockWelperProfileRepo.findOne
        .mockResolvedValueOnce(profile()) // by welperId
        .mockResolvedValueOnce(null); // taken check
      mockWelperProfileRepo.save.mockImplementation(async (p: WelperProfile) => p);

      const result = await service.claimHandle('welper-1', 'Marie-M');
      expect(result).toEqual({ handle: 'marie-m' });
      expect(mockWelperProfileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ handle: 'marie-m' }),
      );
    });

    it('404s when the welper profile does not exist', async () => {
      mockWelperProfileRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.claimHandle('nope', 'marie-m')).rejects.toThrow(NotFoundException);
    });

    it('409 HANDLE_ALREADY_SET when the profile already has a handle (set-once)', async () => {
      mockWelperProfileRepo.findOne.mockResolvedValueOnce(profile({ handle: 'existing' }));
      const err = await service.claimHandle('welper-1', 'marie-m').catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(errorCode(err)).toBe('HANDLE_ALREADY_SET');
      expect(mockWelperProfileRepo.save).not.toHaveBeenCalled();
    });

    it('409 HANDLE_TAKEN when another welper already claimed it', async () => {
      mockWelperProfileRepo.findOne
        .mockResolvedValueOnce(profile())
        .mockResolvedValueOnce(profile({ welperId: 'welper-2', handle: 'marie-m' }));
      const err = await service.claimHandle('welper-1', 'marie-m').catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(errorCode(err)).toBe('HANDLE_TAKEN');
    });

    it('maps a unique-violation race on save to 409 HANDLE_TAKEN', async () => {
      mockWelperProfileRepo.findOne
        .mockResolvedValueOnce(profile())
        .mockResolvedValueOnce(null);
      mockWelperProfileRepo.save.mockRejectedValueOnce(
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );
      const err = await service.claimHandle('welper-1', 'marie-m').catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(errorCode(err)).toBe('HANDLE_TAKEN');
    });
  });

  describe('resolveHandleToWelperId', () => {
    it('resolves a known handle (case-insensitively)', async () => {
      mockWelperProfileRepo.findOne.mockResolvedValueOnce({ welperId: 'welper-1' });
      await expect(service.resolveHandleToWelperId('Marie-M')).resolves.toBe('welper-1');
      expect(mockWelperProfileRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { handle: 'marie-m' } }),
      );
    });

    it('returns null for syntactically invalid handles without querying', async () => {
      await expect(service.resolveHandleToWelperId('!!bad!!')).resolves.toBeNull();
      expect(mockWelperProfileRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns null for unknown handles', async () => {
      mockWelperProfileRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.resolveHandleToWelperId('ghost')).resolves.toBeNull();
    });
  });
});
