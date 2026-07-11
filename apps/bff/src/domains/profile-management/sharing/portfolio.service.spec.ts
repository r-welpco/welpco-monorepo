import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { WelperPortfolioPhoto } from '../entities/welper-portfolio-photo.entity';
import { PortfolioPhotoStatus } from '../entities/portfolio-photo-status.enum';
import { ServiceOffering } from '../entities/service-offering.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { S3UrlPresignerService } from '../../../clients/s3';
import { NotificationService } from '../../notification/notification.service';
import { PORTFOLIO_MAX_PHOTOS } from './dto';

function errorCode(err: unknown): string | undefined {
  if (err instanceof HttpException) {
    const response = err.getResponse();
    if (typeof response === 'object' && response !== null) {
      return (response as { code?: string }).code;
    }
  }
  return undefined;
}

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockPhotoRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((v: Partial<WelperPortfolioPhoto>) => v),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockOfferingRepo = {
    findOne: jest.fn(),
  };

  const mockWelperProfileRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockS3Presigner = {
    isConfigured: jest.fn().mockReturnValue(true),
    presignPut: jest.fn().mockResolvedValue('https://s3.example/put'),
    getTtlSeconds: jest.fn().mockReturnValue(900),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'AWS_S3_BUCKET') return 'welpco-uploads';
      if (key === 'AWS_S3_REGION') return 'ca-central-1';
      return undefined;
    }),
  };

  const mockNotificationService = {
    resolveLocaleForUser: jest.fn().mockResolvedValue('en'),
    emitForUser: jest.fn().mockResolvedValue(null),
  };

  const maxSortQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ max: '-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPhotoRepo.createQueryBuilder.mockReturnValue(maxSortQueryBuilder);
    maxSortQueryBuilder.getRawOne.mockResolvedValue({ max: '-1' });
    mockS3Presigner.isConfigured.mockReturnValue(true);
    mockS3Presigner.presignPut.mockResolvedValue('https://s3.example/put');
    mockNotificationService.resolveLocaleForUser.mockResolvedValue('en');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: getRepositoryToken(WelperPortfolioPhoto), useValue: mockPhotoRepo },
        { provide: getRepositoryToken(ServiceOffering), useValue: mockOfferingRepo },
        { provide: getRepositoryToken(WelperProfile), useValue: mockWelperProfileRepo },
        { provide: S3UrlPresignerService, useValue: mockS3Presigner },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  describe('presignUpload', () => {
    it('mints a namespaced key with a content-type-derived extension', async () => {
      const result = await service.presignUpload('welper-1', {
        contentType: 'image/webp',
        fileSize: 1024,
      });
      expect(result.key).toMatch(/^portfolio\/welper-1\/[0-9a-f-]{36}\.webp$/);
      expect(result.uploadUrl).toBe('https://s3.example/put');
      expect(result.ttlSeconds).toBe(900);
      expect(mockS3Presigner.presignPut).toHaveBeenCalledWith(result.key, 'image/webp');
    });

    it('503s when the presigner is not configured', async () => {
      mockS3Presigner.isConfigured.mockReturnValue(false);
      await expect(
        service.presignUpload('welper-1', { contentType: 'image/jpeg', fileSize: 1 }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('create (cap + namespace + offering ownership)', () => {
    const validDto = { s3Key: 'portfolio/welper-1/abc.jpg' };

    it('creates a pending photo with the next sortOrder', async () => {
      mockPhotoRepo.count.mockResolvedValue(3);
      maxSortQueryBuilder.getRawOne.mockResolvedValue({ max: '7' });
      mockPhotoRepo.save.mockImplementation(async (p: WelperPortfolioPhoto) => ({
        ...p,
        id: 'photo-1',
        createdAt: new Date(),
      }));

      const result = await service.create('welper-1', { ...validDto, caption: '  Nice tiles  ' });
      expect(result.status).toBe(PortfolioPhotoStatus.PENDING);
      expect(result.sortOrder).toBe(8);
      expect(result.caption).toBe('Nice tiles');
      expect(result.url).toBe(
        'https://welpco-uploads.s3.ca-central-1.amazonaws.com/portfolio/welper-1/abc.jpg',
      );
    });

    it(`409 PORTFOLIO_LIMIT_REACHED at the ${PORTFOLIO_MAX_PHOTOS}-photo cap`, async () => {
      mockPhotoRepo.count.mockResolvedValue(PORTFOLIO_MAX_PHOTOS);
      const err = await service.create('welper-1', validDto).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(errorCode(err)).toBe('PORTFOLIO_LIMIT_REACHED');
      expect(mockPhotoRepo.save).not.toHaveBeenCalled();
    });

    it('400 INVALID_S3_KEY when the key is outside the caller namespace', async () => {
      const err = await service
        .create('welper-1', { s3Key: 'portfolio/other-welper/abc.jpg' })
        .catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(errorCode(err)).toBe('INVALID_S3_KEY');
    });

    it('400 OFFERING_NOT_FOUND when the offering is not the caller’s', async () => {
      mockPhotoRepo.count.mockResolvedValue(0);
      mockOfferingRepo.findOne.mockResolvedValue(null);
      const err = await service
        .create('welper-1', { ...validDto, offeringId: 'f3b9c2de-0000-4000-8000-000000000000' })
        .catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(errorCode(err)).toBe('OFFERING_NOT_FOUND');
    });
  });

  describe('moderate (SHARE-001 moderation transitions)', () => {
    const pendingPhoto = () =>
      ({
        id: 'photo-1',
        welperId: 'welper-1',
        s3Key: 'portfolio/welper-1/abc.jpg',
        caption: null,
        offeringId: null,
        sortOrder: 0,
        status: PortfolioPhotoStatus.PENDING,
        rejectionReason: null,
        createdAt: new Date(),
      }) as WelperPortfolioPhoto;

    it('approves a pending photo and clears any rejection reason', async () => {
      const photo = { ...pendingPhoto(), rejectionReason: 'old reason' };
      mockPhotoRepo.findOne.mockResolvedValue(photo);
      mockPhotoRepo.save.mockImplementation(async (p: WelperPortfolioPhoto) => p);

      const result = await service.moderate('photo-1', {
        status: PortfolioPhotoStatus.APPROVED,
      });
      expect(result.status).toBe(PortfolioPhotoStatus.APPROVED);
      expect(result.rejectionReason).toBeNull();
      expect(mockNotificationService.emitForUser).not.toHaveBeenCalled();
    });

    it('rejects with a reason and notifies the welper', async () => {
      mockPhotoRepo.findOne.mockResolvedValue(pendingPhoto());
      mockPhotoRepo.save.mockImplementation(async (p: WelperPortfolioPhoto) => p);

      const result = await service.moderate('photo-1', {
        status: PortfolioPhotoStatus.REJECTED,
        rejectionReason: 'Blurry photo',
      });
      expect(result.status).toBe(PortfolioPhotoStatus.REJECTED);
      expect(result.rejectionReason).toBe('Blurry photo');
      expect(mockNotificationService.emitForUser).toHaveBeenCalledWith(
        'welper-1',
        expect.objectContaining({
          body: expect.stringContaining('Blurry photo'),
        }),
      );
    });

    it('swallows notification failures — moderation still succeeds', async () => {
      mockPhotoRepo.findOne.mockResolvedValue(pendingPhoto());
      mockPhotoRepo.save.mockImplementation(async (p: WelperPortfolioPhoto) => p);
      mockNotificationService.emitForUser.mockRejectedValueOnce(new Error('smtp down'));

      const result = await service.moderate('photo-1', {
        status: PortfolioPhotoStatus.REJECTED,
        rejectionReason: 'x',
      });
      expect(result.status).toBe(PortfolioPhotoStatus.REJECTED);
    });

    it('404s for unknown photo ids', async () => {
      mockPhotoRepo.findOne.mockResolvedValue(null);
      await expect(
        service.moderate('ghost', { status: PortfolioPhotoStatus.APPROVED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listApprovedPublic', () => {
    it('returns only the public shape for approved photos', async () => {
      mockPhotoRepo.find.mockResolvedValue([
        {
          id: 'p1',
          welperId: 'welper-1',
          s3Key: 'portfolio/welper-1/a.jpg',
          caption: 'Kitchen deep clean',
          offeringId: 'off-1',
          sortOrder: 0,
          status: PortfolioPhotoStatus.APPROVED,
          rejectionReason: null,
          createdAt: new Date(),
        },
      ]);

      const result = await service.listApprovedPublic('welper-1');
      expect(result).toEqual([
        {
          id: 'p1',
          url: 'https://welpco-uploads.s3.ca-central-1.amazonaws.com/portfolio/welper-1/a.jpg',
          caption: 'Kitchen deep clean',
          offeringId: 'off-1',
        },
      ]);
      expect(mockPhotoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { welperId: 'welper-1', status: PortfolioPhotoStatus.APPROVED },
          take: PORTFOLIO_MAX_PHOTOS,
        }),
      );
    });
  });

  describe('ownership scoping', () => {
    it('404s (never 403) when updating a photo that is not yours', async () => {
      mockPhotoRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('welper-1', 'someone-elses-photo', { caption: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPhotoRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'someone-elses-photo', welperId: 'welper-1' },
      });
    });

    it('400 INVALID_PHOTO_IDS on reorder with a foreign id', async () => {
      mockPhotoRepo.find.mockResolvedValue([{ id: 'a', welperId: 'welper-1', sortOrder: 0 }]);
      const err = await service
        .reorder('welper-1', { photoIds: ['a', 'b'] })
        .catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(errorCode(err)).toBe('INVALID_PHOTO_IDS');
    });
  });
});
