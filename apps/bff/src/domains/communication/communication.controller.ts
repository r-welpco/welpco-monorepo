import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  CurrentUser,
  SignupCompletedGuard,
} from '../../common/auth';
import { CommunicationService } from './communication.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';

interface AuthUser {
  userId: string;
  email: string;
  accountType: string;
  effectiveRole: string;
}

@ApiTags('Booking Chat')
@Controller('bookings/:bookingId/chat')
@UseGuards(JwtAuthGuard, SignupCompletedGuard)
@ApiBearerAuth('JWT-auth')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get()
  @ApiOperation({ summary: 'Get or create chat thread for a booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Chat thread' })
  @ApiResponse({ status: 403, description: 'Not a participant of this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getOrCreateThread(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
  ) {
    return this.communicationService.getOrCreateThread(
      bookingId,
      user.userId,
      user.effectiveRole,
    );
  }

  @Get('messages')
  @ApiOperation({ summary: 'List messages in the booking chat' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Paginated messages' })
  @ApiResponse({ status: 403, description: 'Not a participant of this booking' })
  async getMessages(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.communicationService.getMessages(
      bookingId,
      user.userId,
      user.effectiveRole,
      query,
    );
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message in the booking chat' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 201, description: 'Message created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Not a participant of this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.communicationService.sendMessage(
      bookingId,
      user.userId,
      user.effectiveRole,
      dto,
    );
  }

  /**
   * Wave 2 (BFF): mark the requesting user's lastReadAt cursor to NOW().
   *
   * Idempotent — calling twice in a row simply re-bumps the timestamp. The
   * response mirrors `GET /api/bookings/:bookingId/chat` so the client can
   * swap state without a second round-trip.
   *
   * Per-role: customer requests update `last_read_at_customer`; welper requests
   * update `last_read_at_welper`. The other party's cursor is never touched.
   */
  @Post('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark the requesting user\'s chat thread as read (idempotent)' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Thread marked read' })
  @ApiResponse({ status: 403, description: 'Not a participant of this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
  ) {
    return this.communicationService.markThreadRead(
      bookingId,
      user.userId,
      user.effectiveRole,
    );
  }
}
