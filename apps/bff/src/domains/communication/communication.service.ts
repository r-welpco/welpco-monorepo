import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatThread } from './entities/chat-thread.entity';
import { Message } from './entities/message.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import { BookingService } from '../booking/booking.service';
import { UsersService } from '../user-management/users/users.service';
import { WelperProfileService } from '../profile-management/welper-profile/welper-profile.service';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { MessageDto } from './dto/message.dto';
import { ChatThreadDto } from './dto/chat-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesQueryDto, getMessagesQueryParams } from './dto/messages-query.dto';
import { ChatInboxItemDto } from './dto/chat-inbox-item.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
import { ApplicationSettingsService } from '../payment/application-settings.service';
import { isBookingParticipantMessagingOpen } from '../booking/dispute-report-window';

const INBOX_PREVIEW_MAX = 160;

function truncatePreview(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Wave 2: derive which side ("customer" or "welper") of the chat the
 * requesting user is on, given the booking. Throws if the user isn't a
 * participant — callers must precede this with `assertParticipant`.
 */
function resolveChatSide(
  booking: Pick<BookingRequest, 'customerId' | 'welperId'>,
  userId: string,
): 'customer' | 'welper' {
  if (booking.customerId === userId) return 'customer';
  if (booking.welperId === userId) return 'welper';
  // Defensive: assertParticipant should have caught this. We don't want to
  // silently default to one side if the user is somehow neither.
  throw new Error(
    `User ${userId} is neither customer nor welper of booking ${(booking as BookingRequest).id ?? '<unknown>'}`,
  );
}

function pickLastReadAt(
  thread: Pick<ChatThread, 'lastReadAtCustomer' | 'lastReadAtWelper'>,
  side: 'customer' | 'welper',
): string | null {
  const cursor = side === 'customer' ? thread.lastReadAtCustomer : thread.lastReadAtWelper;
  return cursor ? cursor.toISOString() : null;
}

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepo: Repository<CustomerProfile>,
    @InjectRepository(ChatThread)
    private readonly threadRepo: Repository<ChatThread>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly bookingService: BookingService,
    private readonly usersService: UsersService,
    private readonly welperProfileService: WelperProfileService,
    private readonly customerProfileService: CustomerProfileService,
    private readonly notificationService: NotificationService,
    private readonly applicationSettings: ApplicationSettingsService,
  ) {}

  /**
   * Ensures the current user is the customer or welper of the booking. Throws if not.
   */
  private async assertParticipant(
    bookingId: string,
    userId: string,
    accountType: string,
  ): Promise<void> {
    await this.bookingService.findById(bookingId, userId, accountType);
  }

  private async assertMessagingAllowed(bookingId: string): Promise<BookingRequest> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const windowMinutes = await this.applicationSettings.getDisputeReportWindowMinutes();
    if (!isBookingParticipantMessagingOpen(booking, windowMinutes)) {
      throw new BadRequestException(
        `Messaging is only available for ${windowMinutes} minutes after service completion`,
      );
    }
    return booking;
  }

  async getOrCreateThread(
    bookingId: string,
    userId: string,
    accountType: string,
  ): Promise<ChatThreadDto> {
    await this.assertParticipant(bookingId, userId, accountType);

    let thread = await this.threadRepo.findOne({ where: { bookingId } });
    if (!thread) {
      thread = this.threadRepo.create({ bookingId });
      thread = await this.threadRepo.save(thread);
    }

    // Wave 2: return only the requesting user's lastReadAt — the other party's
    // cursor is private metadata.
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    const side = booking ? resolveChatSide(booking, userId) : null;
    return this.toThreadDto(thread, side);
  }

  /**
   * Wave 2 (BFF): mark the requesting user's lastReadAt cursor to NOW().
   * Idempotent — calling twice in a row just bumps the timestamp.
   *
   * Returns the freshly-bumped cursor in the same shape as `getOrCreateThread`
   * so the client can swap state without a follow-up read.
   */
  async markThreadRead(
    bookingId: string,
    userId: string,
    accountType: string,
  ): Promise<ChatThreadDto> {
    await this.assertParticipant(bookingId, userId, accountType);

    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      // assertParticipant should have thrown a NotFound first, but keep
      // defensive for repo ordering edge cases.
      throw new Error(`Booking ${bookingId} not found`);
    }
    const side = resolveChatSide(booking, userId);

    let thread = await this.threadRepo.findOne({ where: { bookingId } });
    if (!thread) {
      thread = this.threadRepo.create({ bookingId });
    }
    const now = new Date();
    if (side === 'customer') {
      thread.lastReadAtCustomer = now;
    } else {
      thread.lastReadAtWelper = now;
    }
    const saved = await this.threadRepo.save(thread);
    return this.toThreadDto(saved, side);
  }

  async getMessages(
    bookingId: string,
    userId: string,
    accountType: string,
    query: MessagesQueryDto,
  ): Promise<{
    data: MessageDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.assertParticipant(bookingId, userId, accountType);

    const { page, limit, skip } = getMessagesQueryParams(query);

    const thread = await this.threadRepo.findOne({ where: { bookingId } });
    if (!thread) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { chatThreadId: thread.id },
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    const dtos = await Promise.all(
      messages.map((msg) => this.toMessageDto(msg)),
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: dtos,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Bookings where the user is a participant (excludes declined/cancelled), with last chat message preview.
   */
  async listChatInbox(userId: string, _accountType: string): Promise<ChatInboxItemDto[]> {
    const bookings = await this.bookingRepo.find({
      where: [
        {
          customerId: userId,
          status: In([
            BookingRequestStatus.PENDING,
            BookingRequestStatus.ACCEPTED,
            BookingRequestStatus.IN_PROGRESS,
            BookingRequestStatus.COMPLETED,
            BookingRequestStatus.PAYMENT_RELEASED,
            BookingRequestStatus.DISPUTED,
            BookingRequestStatus.NO_SHOW,
          ]),
        },
        {
          welperId: userId,
          status: In([
            BookingRequestStatus.PENDING,
            BookingRequestStatus.ACCEPTED,
            BookingRequestStatus.IN_PROGRESS,
            BookingRequestStatus.COMPLETED,
            BookingRequestStatus.PAYMENT_RELEASED,
            BookingRequestStatus.DISPUTED,
            BookingRequestStatus.NO_SHOW,
          ]),
        },
      ],
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    if (bookings.length === 0) {
      return [];
    }

    const windowMinutes = await this.applicationSettings.getDisputeReportWindowMinutes();
    const messageableBookings = bookings.filter((b) =>
      isBookingParticipantMessagingOpen(b, windowMinutes),
    );

    if (messageableBookings.length === 0) {
      return [];
    }

    const bookingIds = messageableBookings.map((b) => b.id);
    const threads = await this.threadRepo.find({
      where: { bookingId: In(bookingIds) },
    });
    const threadByBookingId = new Map(threads.map((t) => [t.bookingId, t]));

    const threadIds = threads.map((t) => t.id);
    const lastByThreadId = new Map<
      string,
      { content: string; createdAt: Date; senderId: string }
    >();

    if (threadIds.length > 0) {
      const rows: Array<{
        chat_thread_id: string;
        content: string;
        created_at: Date;
        sender_id: string;
      }> = await this.messageRepo.query(
        `SELECT DISTINCT ON (chat_thread_id) chat_thread_id, content, created_at, sender_id
         FROM messages
         WHERE chat_thread_id = ANY($1)
         ORDER BY chat_thread_id, created_at DESC`,
        [threadIds],
      );
      for (const r of rows) {
        lastByThreadId.set(r.chat_thread_id, {
          content: r.content,
          createdAt: new Date(r.created_at),
          senderId: r.sender_id,
        });
      }
    }

    const items: ChatInboxItemDto[] = messageableBookings.map((booking) => {
      const thread = threadByBookingId.get(booking.id);
      const last = thread ? lastByThreadId.get(thread.id) : undefined;
      const isCustomer = booking.customerId === userId;
      const otherPartyId = isCustomer ? booking.welperId : booking.customerId;
      // Wave 2: surface only the requesting user's read cursor. Threads that
      // don't exist yet (no message ever sent) have no cursor — `null`.
      const lastReadAt = thread
        ? pickLastReadAt(thread, isCustomer ? 'customer' : 'welper')
        : null;

      const lastAt = last?.createdAt ?? null;
      const bookingUpdated = booking.updatedAt.getTime();
      const sortTime = Math.max(lastAt?.getTime() ?? 0, bookingUpdated);
      const sortAt = new Date(sortTime).toISOString();

      return {
        bookingId: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        scheduledStartTime: booking.scheduledStartTime,
        otherPartyId,
        lastMessageAt: lastAt?.toISOString() ?? null,
        lastMessagePreview: last ? truncatePreview(last.content, INBOX_PREVIEW_MAX) : null,
        lastMessageSenderId: last?.senderId ?? null,
        sortAt,
        lastReadAt,
      };
    });

    items.sort((a, b) => (a.sortAt < b.sortAt ? 1 : a.sortAt > b.sortAt ? -1 : 0));

    const welperIds = [
      ...new Set(
        messageableBookings
          .filter((b) => b.customerId === userId)
          .map((b) => b.welperId),
      ),
    ];
    const customerIds = [
      ...new Set(
        messageableBookings
          .filter((b) => b.welperId === userId)
          .map((b) => b.customerId),
      ),
    ];

    const [welperProfiles, customerProfiles] = await Promise.all([
      welperIds.length
        ? this.welperProfileRepo.find({
            where: { welperId: In(welperIds) },
            select: ['welperId', 'firstName', 'lastName', 'profilePhotoUrl'],
          })
        : Promise.resolve([] as WelperProfile[]),
      customerIds.length
        ? this.customerProfileRepo.find({
            where: { customerId: In(customerIds) },
            select: ['customerId', 'firstName', 'lastName', 'profilePhotoUrl'],
          })
        : Promise.resolve([] as CustomerProfile[]),
    ]);

    const welperById = new Map(welperProfiles.map((p) => [p.welperId, p]));
    const customerById = new Map(customerProfiles.map((p) => [p.customerId, p]));

    for (const item of items) {
      const booking = messageableBookings.find((b) => b.id === item.bookingId);
      if (!booking) continue;
      if (booking.customerId === userId) {
        const welper = welperById.get(booking.welperId);
        item.otherPartyFirstName = welper?.firstName?.trim() || null;
        item.otherPartyPhotoUrl = welper?.profilePhotoUrl ?? null;
      } else {
        const customer = customerById.get(booking.customerId);
        item.otherPartyFirstName = customer?.firstName?.trim() || null;
        item.otherPartyPhotoUrl = customer?.profilePhotoUrl ?? null;
      }
    }

    return items;
  }

  async sendMessage(
    bookingId: string,
    userId: string,
    accountType: string,
    dto: SendMessageDto,
  ): Promise<MessageDto> {
    await this.assertParticipant(bookingId, userId, accountType);
    const booking = await this.assertMessagingAllowed(bookingId);

    let thread = await this.threadRepo.findOne({ where: { bookingId } });
    if (!thread) {
      thread = this.threadRepo.create({ bookingId });
      thread = await this.threadRepo.save(thread);
    }

    const message = this.messageRepo.create({
      chatThreadId: thread.id,
      senderId: userId,
      content: dto.content.trim(),
    });
    const saved = await this.messageRepo.save(message);

    // NOTIFICATIONS-001 + NOTIFICATIONS-002 (Day 16 dispatch 2): notify the
    // OTHER party in the thread. Sender doesn't get pinged for their own
    // message. The 5-min `metadata.bookingId` dedup window in
    // `NotificationService.send` keeps a fast back-and-forth from spamming
    // the bell — first message in a 5-min window emits, the rest fold in.
    {
      const recipientId =
        booking.customerId === userId ? booking.welperId : booking.customerId;
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const link = `${baseUrl}/dashboard/messages?bookingId=${bookingId}`;
      // Honest body: keep a short preview so the recipient can triage from
      // the bell, but don't leak long content into email subject lines.
      const preview = saved.content.length > 80 ? `${saved.content.slice(0, 80)}…` : saved.content;
      try {
        await this.notificationService.emitForUser(recipientId, {
          category: NotificationCategory.MESSAGE,
          title: 'New message',
          body: preview,
          link,
          metadata: { bookingId, messageId: saved.id, threadId: thread.id },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to emit message notification for ${recipientId}: ${(err as Error).message}`,
        );
      }
    }

    return this.toMessageDto(saved);
  }

  private toThreadDto(
    thread: ChatThread,
    side: 'customer' | 'welper' | null,
  ): ChatThreadDto {
    return {
      id: thread.id,
      bookingId: thread.bookingId,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      // Defensive: when side resolution failed (booking row not found), surface
      // null rather than leaking the wrong party's cursor.
      lastReadAt: side ? pickLastReadAt(thread, side) : null,
    };
  }

  private async toMessageDto(message: Message): Promise<MessageDto> {
    let senderDisplayName = 'User';
    let senderPhotoUrl: string | null = null;
    try {
      const welperProfile = await this.welperProfileService
        .findByWelperId(message.senderId)
        .catch(() => null);
      if (welperProfile?.firstName != null || welperProfile?.lastName != null) {
        senderDisplayName = [welperProfile.firstName, welperProfile.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Welper';
        senderPhotoUrl = welperProfile.profilePhotoUrl ?? null;
        return {
          id: message.id,
          senderId: message.senderId,
          senderDisplayName,
          senderPhotoUrl,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        };
      }
    } catch {
      // try customer profile
    }
    try {
      const customerProfile = await this.customerProfileService
        .findByCustomerId(message.senderId)
        .catch(() => null);
      if (customerProfile?.firstName != null || customerProfile?.lastName != null) {
        senderDisplayName = [customerProfile.firstName, customerProfile.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Customer';
        senderPhotoUrl = customerProfile.profilePhotoUrl ?? null;
        return {
          id: message.id,
          senderId: message.senderId,
          senderDisplayName,
          senderPhotoUrl,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        };
      }
    } catch {
      // fallback to email
    }
    try {
      const user = await this.usersService.findById(message.senderId);
      senderDisplayName = user.email;
    } catch {
      // keep default
    }
    return {
      id: message.id,
      senderId: message.senderId,
      senderDisplayName,
      senderPhotoUrl,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
