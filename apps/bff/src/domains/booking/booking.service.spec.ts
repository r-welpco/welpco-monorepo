import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BookingService } from './booking.service';
import { BookingRequest, BookingRequestStatus } from './entities/booking-request.entity';
import { BookingServiceReceipt } from './entities/booking-service-receipt.entity';
import { ServiceOfferingService } from '../profile-management/service-offering/service-offering.service';
import { ServiceQuestionsService } from '../content-management/service-questions/service-questions.service';
import { AvailabilityService } from '../profile-management/availability/availability.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentService } from '../payment/payment.service';
import { ApplicationSettingsService } from '../payment/application-settings.service';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../profile-management/welper-profile/welper-profile.service';
import { UsersService } from '../user-management/users/users.service';
import { S3UrlPresignerService } from '../../clients/s3';
import { BackgroundCheckService } from '../safety-verification/background-check.service';
import { QuestionType } from '../content-management/entities/question.entity';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: Repository<BookingRequest>;
  let serviceOfferingService: ServiceOfferingService;
  let serviceQuestionsService: ServiceQuestionsService;
  let availabilityService: AvailabilityService;
  let dataSource: DataSource;

  const mockBookingRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockServiceOfferingService = {
    findById: jest.fn(),
  };

  const mockServiceQuestionsService = {
    findByServiceCategory: jest.fn(),
  };

  const mockAvailabilityService = {
    isSlotAvailable: jest.fn(),
  };

  const mockNotificationService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const mockServiceReceiptRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockPaymentService = {
    assertCustomerHasDefaultPaymentMethod: jest.fn().mockResolvedValue(undefined),
    getBookingPaymentSummary: jest.fn().mockResolvedValue(null),
    getAuthorizedHoldCents: jest.fn().mockResolvedValue(null),
    captureForServiceReceipt: jest.fn().mockResolvedValue({ primaryCapturedCents: 0 }),
    onBookingServiceCompleted: jest.fn().mockResolvedValue(undefined),
    onBookingCanceled: jest.fn().mockResolvedValue(undefined),
    authorizeHoldBeforeWelperAccept: jest.fn().mockResolvedValue(undefined),
  };

  const mockApplicationSettingsService = {
    getBookingTaxRateBps: jest.fn().mockResolvedValue(0),
  };

  const mockCustomerProfileService = {
    findByCustomerId: jest.fn().mockResolvedValue({ firstName: 'Test', lastName: 'Customer' }),
  };

  const mockWelperProfileService = {
    findByWelperId: jest.fn().mockResolvedValue({ firstName: 'Test', lastName: 'Welper' }),
  };

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
  };

  const mockBackgroundCheckService = {
    assertCanAcceptBookings: jest.fn().mockResolvedValue(undefined),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      getRepository: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  /** Query builder returned inside transaction repo (conflict check + pessimistic lock reads). */
  const txQueryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
  };

  let txBookingRepo: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    txQueryBuilder.getOne.mockResolvedValue(null);
    txQueryBuilder.getCount.mockResolvedValue(0);

    txBookingRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(txQueryBuilder),
    };
    mockQueryRunner.manager.getRepository.mockReturnValue(txBookingRepo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: getRepositoryToken(BookingRequest), useValue: mockBookingRepo },
        { provide: getRepositoryToken(BookingServiceReceipt), useValue: mockServiceReceiptRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ServiceOfferingService, useValue: mockServiceOfferingService },
        { provide: ServiceQuestionsService, useValue: mockServiceQuestionsService },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: ApplicationSettingsService, useValue: mockApplicationSettingsService },
        { provide: CustomerProfileService, useValue: mockCustomerProfileService },
        { provide: WelperProfileService, useValue: mockWelperProfileService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: BackgroundCheckService, useValue: mockBackgroundCheckService },
        {
          provide: S3UrlPresignerService,
          useValue: {
            // Tests don't exercise S3; default to "no presigner configured" so
            // evidenceFiles[].signedUrl resolves to null without hitting AWS.
            isConfigured: () => false,
            getTtlSeconds: () => 900,
            presignGet: jest.fn().mockResolvedValue(null),
            presignGetMany: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepo = module.get<Repository<BookingRequest>>(getRepositoryToken(BookingRequest));
    serviceOfferingService = module.get<ServiceOfferingService>(ServiceOfferingService);
    serviceQuestionsService = module.get<ServiceQuestionsService>(ServiceQuestionsService);
    availabilityService = module.get<AvailabilityService>(AvailabilityService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const customerId = 'customer-1';
    const welperId = 'welper-1';
    const offeringId = 'offering-1';
    const dto = {
      welperId,
      offeringId,
      answers: {},
      scheduledDate: '2026-06-15',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
      durationMinutes: 120,
    };

    it('should throw when offering does not belong to welper', async () => {
      mockServiceOfferingService.findById.mockResolvedValue({
        id: offeringId,
        welperId: 'other-welper',
        serviceCategoryId: 'cat-1',
        active: true,
      });
      mockServiceQuestionsService.findByServiceCategory.mockResolvedValue([]);

      await expect(service.create(customerId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(customerId, dto)).rejects.toThrow(
        'Offering does not belong to the specified welper',
      );
    });

    it('should throw when offering is inactive', async () => {
      mockServiceOfferingService.findById.mockResolvedValue({
        id: offeringId,
        welperId,
        serviceCategoryId: 'cat-1',
        active: false,
      });
      mockServiceQuestionsService.findByServiceCategory.mockResolvedValue([]);

      await expect(service.create(customerId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(customerId, dto)).rejects.toThrow('Cannot book an inactive offering');
    });

    it('should throw when customer books own service', async () => {
      mockServiceOfferingService.findById.mockResolvedValue({
        id: offeringId,
        welperId: customerId,
        serviceCategoryId: 'cat-1',
        active: true,
      });
      mockServiceQuestionsService.findByServiceCategory.mockResolvedValue([]);

      await expect(service.create(customerId, { ...dto, welperId: customerId })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(customerId, { ...dto, welperId: customerId })).rejects.toThrow(
        'Cannot book your own service',
      );
    });

    it('should throw when slot is not available in welper schedule', async () => {
      mockServiceOfferingService.findById.mockResolvedValue({
        id: offeringId,
        welperId,
        serviceCategoryId: 'cat-1',
        active: true,
        hourlyRate: 25,
      });
      mockServiceQuestionsService.findByServiceCategory.mockResolvedValue([]);
      mockAvailabilityService.isSlotAvailable.mockResolvedValue(false);

      await expect(service.create(customerId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(customerId, dto)).rejects.toThrow(
        /not available in the welper's schedule/,
      );
    });

    it('should create booking when valid and slot available', async () => {
      mockServiceOfferingService.findById.mockResolvedValue({
        id: offeringId,
        welperId,
        serviceCategoryId: 'cat-1',
        active: true,
        hourlyRate: 25,
      });
      mockServiceQuestionsService.findByServiceCategory.mockResolvedValue([]);
      mockAvailabilityService.isSlotAvailable.mockResolvedValue(true);
      const savedBooking = {
        id: 'booking-1',
        customerId,
        welperId,
        serviceOfferingId: offeringId,
        status: BookingRequestStatus.PENDING,
        scheduledDate: dto.scheduledDate,
        scheduledStartTime: dto.scheduledStartTime,
        scheduledEndTime: dto.scheduledEndTime,
        durationMinutes: dto.durationMinutes,
        hourlyRate: 25,
        totalPrice: 50,
        answers: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      txBookingRepo.create.mockReturnValue(savedBooking);
      txBookingRepo.save.mockResolvedValue(savedBooking);

      const result = await service.create(customerId, dto);

      expect(result).toHaveProperty('id', 'booking-1');
      expect(result.status).toBe(BookingRequestStatus.PENDING);
      expect(mockAvailabilityService.isSlotAvailable).toHaveBeenCalledWith(
        welperId,
        dto.scheduledDate,
        dto.scheduledStartTime,
        dto.scheduledEndTime,
      );
    });

    it('should reject badly typed service question answers before saving', async () => {
      mockServiceOfferingService.findById.mockResolvedValue({
        id: offeringId,
        welperId,
        serviceCategoryId: 'cat-1',
        active: true,
        hourlyRate: 25,
      });
      mockServiceQuestionsService.findByServiceCategory.mockResolvedValue([
        {
          id: 'sq-count',
          questionId: 'count-q',
          isRequired: true,
          conditionalLogic: null,
          displayOrder: 0,
          question: {
            id: 'count-q',
            type: QuestionType.NUMBER,
            label: 'How many children',
            validationRules: { min: 1 },
          },
        },
      ]);

      await expect(
        service.create(customerId, {
          ...dto,
          answers: { 'count-q': 'two' as unknown as number },
        }),
      ).rejects.toThrow('Invalid answer for: How many children');
      expect(mockAvailabilityService.isSlotAvailable).not.toHaveBeenCalled();
      expect(txBookingRepo.create).not.toHaveBeenCalled();
    });

    it('should save only visible configured service question answers', async () => {
      mockServiceOfferingService.findById.mockResolvedValue({
        id: offeringId,
        welperId,
        serviceCategoryId: 'cat-1',
        active: true,
        hourlyRate: 25,
      });
      mockServiceQuestionsService.findByServiceCategory.mockResolvedValue([
        {
          id: 'sq-frequency',
          questionId: 'frequency-q',
          isRequired: true,
          conditionalLogic: null,
          displayOrder: 0,
          question: {
            id: 'frequency-q',
            type: QuestionType.CHOICE,
            label: 'One-time or recurring?',
            options: [
              { value: 'one-time', label: 'One time' },
              { value: 'recurring', label: 'Recurring' },
            ],
          },
        },
        {
          id: 'sq-recurrence',
          questionId: 'recurrence-q',
          isRequired: true,
          conditionalLogic: { showIf: { questionId: 'frequency-q', value: 'recurring' } },
          displayOrder: 1,
          question: {
            id: 'recurrence-q',
            type: QuestionType.TEXT,
            label: 'Recurrence',
          },
        },
      ]);
      mockAvailabilityService.isSlotAvailable.mockResolvedValue(true);
      txBookingRepo.create.mockImplementation((booking) => ({
        ...booking,
        id: 'booking-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      txBookingRepo.save.mockImplementation((booking) => Promise.resolve(booking));

      await service.create(customerId, {
        ...dto,
        answers: {
          'frequency-q': 'one-time',
          'recurrence-q': 'stale weekly answer',
          'unknown-q': 'should not be saved',
        },
      });

      expect(txBookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          answers: { 'frequency-q': 'one-time' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFound when booking does not exist', async () => {
      mockBookingRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('missing', 'user-1', 'customer')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw Forbidden when user is not customer or welper', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        customerId: 'c1',
        welperId: 'w1',
        status: BookingRequestStatus.PENDING,
        answers: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.findById('b1', 'other-user', 'customer')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('cancel', () => {
    it('should throw NotFound when booking does not exist', async () => {
      txQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.cancel('missing', 'user-1', 'customer', undefined, undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('should cancel and use timezone offset when provided', async () => {
      const booking = {
        id: 'b1',
        customerId: 'c1',
        welperId: 'w1',
        status: BookingRequestStatus.ACCEPTED,
        scheduledDate: '2026-12-01',
        scheduledStartTime: '14:00',
        scheduledEndTime: '16:00',
        timezoneOffsetMinutes: null,
        answers: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      txQueryBuilder.getOne.mockResolvedValue(booking);
      txBookingRepo.save.mockImplementation((b) => Promise.resolve({ ...b }));

      const result = await service.cancel('b1', 'c1', 'customer', 'Reason', -300);

      expect(txBookingRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(BookingRequestStatus.CANCELLED);
    });

    it('should reject cancel when booking is disputed', async () => {
      const booking = {
        id: 'b1',
        customerId: 'c1',
        welperId: 'w1',
        status: BookingRequestStatus.DISPUTED,
        answers: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      txQueryBuilder.getOne.mockResolvedValue(booking);

      await expect(service.cancel('b1', 'c1', 'customer', undefined, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(txBookingRepo.save).not.toHaveBeenCalled();
    });
  });
});
