import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityCalendar } from '../entities/availability-calendar.entity';
import { AvailabilityException } from '../entities/availability-exception.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DayOfWeek } from '../entities/day-of-week.enum';
import { RecurringPattern } from '../entities/recurring-pattern.enum';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepository: Repository<AvailabilityCalendar>;
  let exceptionRepository: Repository<AvailabilityException>;
  let welperProfileRepository: Repository<WelperProfile>;
  let eventPublisher: EventPublisherService;

  const mockAvailabilityRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockExceptionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockWelperProfileRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockEventPublisher = {
    publishAvailabilityUpdated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(AvailabilityCalendar),
          useValue: mockAvailabilityRepository,
        },
        {
          provide: getRepositoryToken(AvailabilityException),
          useValue: mockExceptionRepository,
        },
        {
          provide: getRepositoryToken(WelperProfile),
          useValue: mockWelperProfileRepository,
        },
        {
          provide: EventPublisherService,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    availabilityRepository = module.get<Repository<AvailabilityCalendar>>(
      getRepositoryToken(AvailabilityCalendar),
    );
    exceptionRepository = module.get<Repository<AvailabilityException>>(
      getRepositoryToken(AvailabilityException),
    );
    welperProfileRepository = module.get<Repository<WelperProfile>>(
      getRepositoryToken(WelperProfile),
    );
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByWelperId', () => {
    it('should return paginated availability calendars', async () => {
      const welperId = 'welper-1';
      const page = 1;
      const limit = 20;
      const data = [
        {
          id: 'calendar-1',
          welperId,
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '09:00',
          endTime: '17:00',
          recurringPattern: RecurringPattern.WEEKLY,
          available: true,
        },
      ];
      const total = 1;

      mockAvailabilityRepository.findAndCount.mockResolvedValue([data, total]);

      const result = await service.findByWelperId(welperId, page, limit);

      expect(result.data).toEqual(data);
      expect(result.total).toBe(total);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(mockAvailabilityRepository.findAndCount).toHaveBeenCalledWith({
        where: { welperId },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        skip: 0,
        take: limit,
      });
    });

    it('should filter by dayOfWeek and available', async () => {
      const welperId = 'welper-1';
      const dayOfWeek = DayOfWeek.MONDAY;
      const available = true;

      mockAvailabilityRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findByWelperId(welperId, 1, 20, dayOfWeek, available);

      expect(mockAvailabilityRepository.findAndCount).toHaveBeenCalledWith({
        where: { welperId, dayOfWeek, available: true },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('update', () => {
    it('should update availability calendar', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const updateDto = [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '09:00',
          endTime: '17:00',
          recurringPattern: RecurringPattern.WEEKLY,
          available: true,
        },
      ];

      const welperProfile = { id: 'profile-1', welperId };
      const savedCalendars = [
        {
          id: 'calendar-1',
          welperId,
          ...updateDto[0],
          effectiveDateStart: null,
          effectiveDateEnd: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWelperProfileRepository.findOne.mockResolvedValue(welperProfile);
      mockAvailabilityRepository.find.mockResolvedValue([]);
      mockAvailabilityRepository.create.mockReturnValue(savedCalendars[0]);
      mockAvailabilityRepository.save.mockResolvedValue(savedCalendars);
      mockEventPublisher.publishAvailabilityUpdated.mockResolvedValue(undefined);

      const result = await service.update(welperId, updateDto, userId);

      expect(result).toHaveLength(1);
      expect(mockAvailabilityRepository.find).toHaveBeenCalledWith({
        where: { welperId },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
      });
      expect(mockAvailabilityRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishAvailabilityUpdated).toHaveBeenCalled();
    });

    it('should throw NotFoundException if welper profile not found', async () => {
      mockWelperProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('welper-1', [], 'welper-1'),
      ).rejects.toThrow('Welper profile not found');
    });

    it('should throw ForbiddenException if updating another user availability', async () => {
      mockWelperProfileRepository.findOne.mockResolvedValue({ id: 'profile-1', welperId: 'welper-1' });

      await expect(
        service.update('welper-1', [], 'different-user'),
      ).rejects.toThrow('You can only update your own availability');
    });

    it('should preserve existing calendars and exceptions when adding a new slot (diff-based update)', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const existingCalendars = [
        {
          id: 'calendar-1',
          welperId,
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '09:00',
          endTime: '17:00',
          recurringPattern: RecurringPattern.WEEKLY,
          available: true,
          effectiveDateStart: null,
          effectiveDateEnd: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const updateDto = [
        { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '17:00', recurringPattern: RecurringPattern.WEEKLY, available: true },
        { dayOfWeek: DayOfWeek.TUESDAY, startTime: '10:00', endTime: '18:00', recurringPattern: RecurringPattern.WEEKLY, available: true },
      ];

      const welperProfile = { id: 'profile-1', welperId };
      const newCalendar = {
        id: 'calendar-2',
        welperId,
        ...updateDto[1],
        effectiveDateStart: null,
        effectiveDateEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWelperProfileRepository.findOne.mockResolvedValue(welperProfile);
      mockAvailabilityRepository.find.mockResolvedValue(existingCalendars);
      mockAvailabilityRepository.create.mockImplementation((dto: any) => ({ ...dto, id: 'calendar-2' }));
      mockAvailabilityRepository.save.mockResolvedValue([newCalendar]);
      mockEventPublisher.publishAvailabilityUpdated.mockResolvedValue(undefined);

      const result = await service.update(welperId, updateDto, userId);

      expect(result).toHaveLength(2);
      expect(mockAvailabilityRepository.remove).not.toHaveBeenCalled();
      expect(mockExceptionRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(mockAvailabilityRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ dayOfWeek: DayOfWeek.TUESDAY })]),
      );
    });
  });

  describe('findExceptionsByWelperId', () => {
    it('should return exceptions for a calendar when calendarId is provided', async () => {
      const welperId = 'welper-1';
      const calendarId = 'calendar-1';
      const exceptions = [
        { id: 'ex-1', calendarId, date: new Date('2025-01-15'), endDate: null, available: false, reason: null },
      ];

      const calendar = { id: calendarId, welperId };
      mockAvailabilityRepository.findOne.mockResolvedValue(calendar);
      mockExceptionRepository.find.mockResolvedValue(exceptions);

      const result = await service.findExceptionsByWelperId(welperId, calendarId);

      expect(result).toEqual(exceptions);
      expect(mockAvailabilityRepository.findOne).toHaveBeenCalledWith({ where: { id: calendarId, welperId } });
      expect(mockExceptionRepository.find).toHaveBeenCalledWith({ where: { calendarId }, order: { date: 'DESC' } });
    });

    it('should return empty array when calendarId not found for welper', async () => {
      mockAvailabilityRepository.findOne.mockResolvedValue(null);

      const result = await service.findExceptionsByWelperId('welper-1', 'unknown-calendar');

      expect(result).toEqual([]);
    });

    it('should return all exceptions for welper when calendarId is not provided', async () => {
      const welperId = 'welper-1';
      const calendars = [{ id: 'cal-1' }, { id: 'cal-2' }];
      const exceptions = [{ id: 'ex-1', calendarId: 'cal-1', date: new Date(), endDate: null, available: false, reason: null }];

      mockAvailabilityRepository.find.mockResolvedValue(calendars);
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(exceptions),
      };
      mockExceptionRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findExceptionsByWelperId(welperId);

      expect(result).toEqual(exceptions);
      expect(mockExceptionRepository.createQueryBuilder).toHaveBeenCalledWith('e');
      expect(mockQb.where).toHaveBeenCalledWith('e.calendarId IN (:...calendarIds)', { calendarIds: ['cal-1', 'cal-2'] });
    });

    it('should return empty array when welper has no calendars', async () => {
      mockAvailabilityRepository.find.mockResolvedValue([]);

      const result = await service.findExceptionsByWelperId('welper-1');

      expect(result).toEqual([]);
      expect(mockExceptionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('createException', () => {
    it('should create an availability exception', async () => {
      const welperId = 'welper-1';
      const dto = {
        calendarId: 'calendar-1',
        date: '2025-01-31',
        endDate: undefined as string | undefined,
        available: false,
        reason: 'Holiday',
      };
      const calendar = { id: dto.calendarId, welperId };
      const savedException = {
        id: 'ex-1',
        ...dto,
        date: new Date(dto.date),
        endDate: null,
        createdAt: new Date(),
      };

      mockAvailabilityRepository.findOne.mockResolvedValue(calendar);
      mockExceptionRepository.create.mockReturnValue(savedException);
      mockExceptionRepository.save.mockResolvedValue(savedException);

      const result = await service.createException(welperId, dto);

      expect(result).toEqual(savedException);
      expect(mockAvailabilityRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.calendarId, welperId } });
      expect(mockExceptionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when calendar not found', async () => {
      mockAvailabilityRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createException('welper-1', {
          calendarId: 'unknown',
          date: '2025-01-31',
          available: false,
        }),
      ).rejects.toThrow('Availability calendar not found or access denied');
    });
  });

  describe('deleteException', () => {
    it('should delete an exception when it belongs to welper', async () => {
      const welperId = 'welper-1';
      const exception = { id: 'ex-1', calendarId: 'cal-1', date: new Date(), endDate: null, available: false, reason: null };
      const calendar = { id: 'cal-1', welperId };

      mockExceptionRepository.findOne.mockResolvedValue(exception);
      mockAvailabilityRepository.findOne.mockResolvedValue(calendar);
      mockExceptionRepository.remove.mockResolvedValue(exception as any);

      await service.deleteException(welperId, 'ex-1');

      expect(mockExceptionRepository.remove).toHaveBeenCalledWith(exception);
    });

    it('should throw NotFoundException when exception not found', async () => {
      mockExceptionRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteException('welper-1', 'ex-unknown')).rejects.toThrow(
        'Availability exception not found',
      );
    });

    it('should throw ForbiddenException when exception belongs to another welper', async () => {
      const exception = { id: 'ex-1', calendarId: 'cal-1', date: new Date(), endDate: null, available: false, reason: null };
      mockExceptionRepository.findOne.mockResolvedValue(exception);
      mockAvailabilityRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteException('welper-1', 'ex-1')).rejects.toThrow(
        'You can only delete your own availability exceptions',
      );
    });
  });

  describe('getWeeklySummariesForWelpers', () => {
    it('returns Mon–Sun booleans and adHocOnly per welper', async () => {
      mockWelperProfileRepository.find.mockResolvedValue([
        { welperId: 'w1', availabilityAdHocOnly: false },
        { welperId: 'w2', availabilityAdHocOnly: true },
      ]);
      mockAvailabilityRepository.find.mockResolvedValue([
        { welperId: 'w1', dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '17:00' },
        { welperId: 'w1', dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '10:00', endTime: '14:00' },
        { welperId: 'w1', dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00', endTime: '12:00' },
      ]);

      const result = await service.getWeeklySummariesForWelpers(['w1', 'w2']);

      expect(result.get('w1')).toEqual({
        adHocOnly: false,
        days: [true, false, true, false, true, false, false],
        schedule: [
          { slots: [{ startTime: '09:00', endTime: '17:00' }] },
          { slots: [] },
          { slots: [{ startTime: '10:00', endTime: '14:00' }] },
          { slots: [] },
          { slots: [{ startTime: '09:00', endTime: '12:00' }] },
          { slots: [] },
          { slots: [] },
        ],
      });
      expect(result.get('w2')).toEqual({
        adHocOnly: true,
        days: [false, false, false, false, false, false, false],
        schedule: [
          { slots: [] },
          { slots: [] },
          { slots: [] },
          { slots: [] },
          { slots: [] },
          { slots: [] },
          { slots: [] },
        ],
      });
    });

    it('returns empty map when no welper ids are provided', async () => {
      const result = await service.getWeeklySummariesForWelpers([]);
      expect(result.size).toBe(0);
      expect(mockWelperProfileRepository.find).not.toHaveBeenCalled();
    });
  });
});

