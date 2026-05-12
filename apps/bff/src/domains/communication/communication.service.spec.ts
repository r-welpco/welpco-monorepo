import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommunicationService } from './communication.service';
import { ChatThread } from './entities/chat-thread.entity';
import { Message } from './entities/message.entity';
import { BookingRequest } from '../booking/entities/booking-request.entity';
import { BookingService } from '../booking/booking.service';
import { UsersService } from '../user-management/users/users.service';
import { WelperProfileService } from '../profile-management/welper-profile/welper-profile.service';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';

const BOOKING_ID = '00000000-0000-0000-0000-000000000001';
const CUSTOMER_ID = '00000000-0000-0000-0000-000000000002';
const WELPER_ID = '00000000-0000-0000-0000-000000000003';
const THREAD_ID = '00000000-0000-0000-0000-000000000010';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000099';

describe('CommunicationService', () => {
  let service: CommunicationService;
  let threadRepo: jest.Mocked<Repository<ChatThread>>;
  let messageRepo: jest.Mocked<Repository<Message>>;
  let bookingService: jest.Mocked<BookingService>;
  let usersService: jest.Mocked<UsersService>;

  const mockThreadRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMessageRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockBookingRepo = {
    find: jest.fn().mockResolvedValue([]),
    // Wave 2: communicationService now resolves the requesting user's chat
    // side from the booking row. Default to a stub where both customer + welper
    // ids match so resolveChatSide() picks "customer" for CUSTOMER_ID and
    // "welper" for WELPER_ID. Individual tests can override per-call.
    findOne: jest.fn().mockResolvedValue({
      id: BOOKING_ID,
      customerId: CUSTOMER_ID,
      welperId: WELPER_ID,
    }),
  };

  const mockBookingService = {
    findById: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockWelperProfileService = {
    findByWelperId: jest.fn(),
  };

  const mockCustomerProfileService = {
    findByCustomerId: jest.fn(),
  };

  // NOTIFICATIONS-001 + NOTIFICATIONS-002 (Day 16 dispatch 2): sendMessage
  // now emits a MESSAGE notification to the OTHER party in the thread.
  const mockNotificationService = {
    emitForUser: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockWelperProfileService.findByWelperId.mockRejectedValue(new Error('not welper'));
    mockCustomerProfileService.findByCustomerId.mockRejectedValue(new Error('not customer'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        { provide: getRepositoryToken(BookingRequest), useValue: mockBookingRepo },
        { provide: getRepositoryToken(ChatThread), useValue: mockThreadRepo },
        { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
        { provide: BookingService, useValue: mockBookingService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: WelperProfileService, useValue: mockWelperProfileService },
        { provide: CustomerProfileService, useValue: mockCustomerProfileService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
    threadRepo = module.get(getRepositoryToken(ChatThread));
    messageRepo = module.get(getRepositoryToken(Message));
    bookingService = module.get(BookingService);
    usersService = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getOrCreateThread', () => {
    it('should create thread when missing and return it', async () => {
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(null);
      const newThread = {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockThreadRepo.create.mockReturnValue(newThread);
      mockThreadRepo.save.mockResolvedValue(newThread);

      const result = await service.getOrCreateThread(
        BOOKING_ID,
        CUSTOMER_ID,
        'Customer',
      );

      expect(bookingService.findById).toHaveBeenCalledWith(
        BOOKING_ID,
        CUSTOMER_ID,
        'Customer',
      );
      expect(threadRepo.findOne).toHaveBeenCalledWith({
        where: { bookingId: BOOKING_ID },
      });
      expect(threadRepo.create).toHaveBeenCalledWith({ bookingId: BOOKING_ID });
      expect(threadRepo.save).toHaveBeenCalledWith(newThread);
      expect(result.id).toBe(THREAD_ID);
      expect(result.bookingId).toBe(BOOKING_ID);
    });

    it('should return existing thread when found', async () => {
      const existingThread = {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(existingThread);

      const result = await service.getOrCreateThread(
        BOOKING_ID,
        WELPER_ID,
        'Welper',
      );

      expect(threadRepo.create).not.toHaveBeenCalled();
      expect(threadRepo.save).not.toHaveBeenCalled();
      expect(result.id).toBe(THREAD_ID);
    });

    it('should throw when user is not a participant', async () => {
      mockBookingService.findById.mockRejectedValue(
        new ForbiddenException('You are not authorized to view this booking'),
      );

      await expect(
        service.getOrCreateThread(BOOKING_ID, OTHER_USER_ID, 'Customer'),
      ).rejects.toThrow(ForbiddenException);
      expect(threadRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return empty list when no thread exists', async () => {
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(null);

      const result = await service.getMessages(
        BOOKING_ID,
        CUSTOMER_ID,
        'Customer',
        { page: 1, limit: 20 },
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(messageRepo.findAndCount).not.toHaveBeenCalled();
    });

    it('should return messages when thread exists and user is participant', async () => {
      const thread = {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const msgEntity = {
        id: '00000000-0000-0000-0000-000000000020',
        chatThreadId: THREAD_ID,
        senderId: CUSTOMER_ID,
        content: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockMessageRepo.findAndCount.mockResolvedValue([[msgEntity], 1]);
      mockUsersService.findById.mockResolvedValue({
        id: CUSTOMER_ID,
        email: 'customer@example.com',
      });

      const result = await service.getMessages(
        BOOKING_ID,
        CUSTOMER_ID,
        'Customer',
        { page: 1, limit: 50 },
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].content).toBe('Hello');
      expect(result.data[0].senderDisplayName).toBe('customer@example.com');
      expect(result.total).toBe(1);
    });

    it('should throw when user is not a participant', async () => {
      mockBookingService.findById.mockRejectedValue(
        new ForbiddenException('You are not authorized to view this booking'),
      );

      await expect(
        service.getMessages(BOOKING_ID, OTHER_USER_ID, 'Customer', {}),
      ).rejects.toThrow(ForbiddenException);
      expect(threadRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should create message when user is participant', async () => {
      const thread = {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const savedMessage = {
        id: '00000000-0000-0000-0000-000000000021',
        chatThreadId: THREAD_ID,
        senderId: CUSTOMER_ID,
        content: 'Hi there',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockMessageRepo.create.mockReturnValue(savedMessage);
      mockMessageRepo.save.mockResolvedValue(savedMessage);
      mockUsersService.findById.mockResolvedValue({
        id: CUSTOMER_ID,
        email: 'customer@example.com',
      });

      const result = await service.sendMessage(
        BOOKING_ID,
        CUSTOMER_ID,
        'Customer',
        { content: 'Hi there' },
      );

      expect(messageRepo.create).toHaveBeenCalledWith({
        chatThreadId: THREAD_ID,
        senderId: CUSTOMER_ID,
        content: 'Hi there',
      });
      expect(messageRepo.save).toHaveBeenCalled();
      expect(result.content).toBe('Hi there');
      expect(result.senderId).toBe(CUSTOMER_ID);
    });

    it('should create thread and then message when thread does not exist', async () => {
      const newThread = {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const savedMessage = {
        id: '00000000-0000-0000-0000-000000000022',
        chatThreadId: THREAD_ID,
        senderId: WELPER_ID,
        content: 'Confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(null);
      mockThreadRepo.create.mockReturnValue(newThread);
      mockThreadRepo.save.mockResolvedValue(newThread);
      mockMessageRepo.create.mockReturnValue(savedMessage);
      mockMessageRepo.save.mockResolvedValue(savedMessage);
      mockUsersService.findById.mockResolvedValue({
        id: WELPER_ID,
        email: 'welper@example.com',
      });

      const result = await service.sendMessage(
        BOOKING_ID,
        WELPER_ID,
        'Welper',
        { content: 'Confirmed' },
      );

      expect(threadRepo.create).toHaveBeenCalledWith({ bookingId: BOOKING_ID });
      expect(threadRepo.save).toHaveBeenCalledWith(newThread);
      expect(result.content).toBe('Confirmed');
    });

    it('should throw when user is not a participant', async () => {
      mockBookingService.findById.mockRejectedValue(
        new ForbiddenException('You are not authorized to view this booking'),
      );

      await expect(
        service.sendMessage(BOOKING_ID, OTHER_USER_ID, 'Customer', {
          content: 'Hello',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(messageRepo.create).not.toHaveBeenCalled();
    });

    it('NOTIFICATIONS-001 + 002: emits a MESSAGE notification to the OTHER party (welper) when customer sends', async () => {
      const thread = {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const savedMessage = {
        id: 'msg-1',
        chatThreadId: THREAD_ID,
        senderId: CUSTOMER_ID,
        content: 'Need a hand at 3?',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockMessageRepo.create.mockReturnValue(savedMessage);
      mockMessageRepo.save.mockResolvedValue(savedMessage);

      await service.sendMessage(BOOKING_ID, CUSTOMER_ID, 'Customer', {
        content: 'Need a hand at 3?',
      });

      expect(mockNotificationService.emitForUser).toHaveBeenCalledTimes(1);
      const [recipient, params] = mockNotificationService.emitForUser.mock.calls[0]!;
      expect(recipient).toBe(WELPER_ID); // OTHER party
      expect(params.category).toBe(NotificationCategory.MESSAGE);
      expect(params.title).toBe('New message');
      expect(params.body).toBe('Need a hand at 3?');
      expect(params.link).toContain(`/dashboard/messages?bookingId=${BOOKING_ID}`);
      expect(params.metadata).toMatchObject({
        bookingId: BOOKING_ID,
        threadId: THREAD_ID,
      });
    });

    it('NOTIFICATIONS-001: recipient flips to customer when WELPER sends', async () => {
      const thread = { id: THREAD_ID, bookingId: BOOKING_ID, createdAt: new Date(), updatedAt: new Date() };
      const savedMessage = {
        id: 'msg-2',
        chatThreadId: THREAD_ID,
        senderId: WELPER_ID,
        content: 'On my way',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockMessageRepo.create.mockReturnValue(savedMessage);
      mockMessageRepo.save.mockResolvedValue(savedMessage);

      await service.sendMessage(BOOKING_ID, WELPER_ID, 'Welper', { content: 'On my way' });

      const [recipient] = mockNotificationService.emitForUser.mock.calls[0]!;
      expect(recipient).toBe(CUSTOMER_ID);
    });
  });

  // Wave 2 (BFF): per-side lastReadAt cursor.
  describe('markThreadRead', () => {
    function existingThread() {
      return {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastReadAtCustomer: null,
        lastReadAtWelper: null,
      };
    }

    it('updates lastReadAtCustomer (and only that column) when caller is the customer', async () => {
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      const thread = existingThread();
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockThreadRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.markThreadRead(BOOKING_ID, CUSTOMER_ID, 'Customer');

      expect(thread.lastReadAtCustomer).toBeInstanceOf(Date);
      expect(thread.lastReadAtWelper).toBeNull();
      expect(result.lastReadAt).not.toBeNull();
    });

    it('updates lastReadAtWelper (and only that column) when caller is the welper', async () => {
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      const thread = existingThread();
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockThreadRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.markThreadRead(BOOKING_ID, WELPER_ID, 'Welper');

      expect(thread.lastReadAtWelper).toBeInstanceOf(Date);
      expect(thread.lastReadAtCustomer).toBeNull();
      expect(result.lastReadAt).not.toBeNull();
    });

    it('creates the thread when missing (idempotent first-read)', async () => {
      mockBookingService.findById.mockResolvedValue({ id: BOOKING_ID });
      mockThreadRepo.findOne.mockResolvedValue(null);
      const newThread = {
        id: THREAD_ID,
        bookingId: BOOKING_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastReadAtCustomer: null,
        lastReadAtWelper: null,
      };
      mockThreadRepo.create.mockReturnValue(newThread);
      mockThreadRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.markThreadRead(BOOKING_ID, CUSTOMER_ID, 'Customer');

      expect(threadRepo.create).toHaveBeenCalledWith({ bookingId: BOOKING_ID });
      expect(result.lastReadAt).not.toBeNull();
    });

    it('throws when caller is not a participant', async () => {
      mockBookingService.findById.mockRejectedValue(
        new ForbiddenException('You are not authorized to view this booking'),
      );

      await expect(
        service.markThreadRead(BOOKING_ID, OTHER_USER_ID, 'Customer'),
      ).rejects.toThrow(ForbiddenException);
      expect(threadRepo.save).not.toHaveBeenCalled();
    });
  });
});
