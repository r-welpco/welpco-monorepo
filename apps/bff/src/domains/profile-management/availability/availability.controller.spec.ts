import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { DayOfWeek } from '../entities/day-of-week.enum';
import { RecurringPattern } from '../entities/recurring-pattern.enum';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let availabilityService: jest.Mocked<Pick<AvailabilityService, 'findByWelperId' | 'update'>>;

  beforeEach(async () => {
    const mockAvailabilityService = {
      findByWelperId: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: mockAvailabilityService,
        },
      ],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
    availabilityService = module.get(AvailabilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailability', () => {
    it('should return paginated availability for welper', async () => {
      const welperId = 'welper-1';
      const data = {
        data: [
          {
            id: 'cal-1',
            welperId,
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '09:00',
            endTime: '17:00',
            recurringPattern: RecurringPattern.WEEKLY,
            available: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      availabilityService.findByWelperId.mockResolvedValue(data as any);

      const result = await controller.getAvailability(welperId);

      expect(result).toEqual(data);
      expect(availabilityService.findByWelperId).toHaveBeenCalledWith(
        welperId,
        1,
        20,
        undefined,
        undefined,
      );
    });

    it('should pass query params to service', async () => {
      const welperId = 'welper-1';
      availabilityService.findByWelperId.mockResolvedValue({ data: [], total: 0, page: 2, limit: 10, totalPages: 0 } as any);

      await controller.getAvailability(welperId, '2', '10', DayOfWeek.FRIDAY, 'true');

      expect(availabilityService.findByWelperId).toHaveBeenCalledWith(
        welperId,
        2,
        10,
        DayOfWeek.FRIDAY,
        true,
      );
    });
  });

  describe('updateAvailability', () => {
    it('should update availability and return saved calendars', async () => {
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
      const saved = [
        {
          id: 'cal-1',
          welperId,
          ...updateDto[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      availabilityService.update.mockResolvedValue(saved as any);

      const result = await controller.updateAvailability(welperId, updateDto, { userId });

      expect(result).toEqual(saved);
      expect(availabilityService.update).toHaveBeenCalledWith(welperId, updateDto, userId);
    });
  });
});
