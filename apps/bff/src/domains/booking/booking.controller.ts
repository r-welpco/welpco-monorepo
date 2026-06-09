import {
  Controller,
  Get,
  Post,
  Patch,
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
  Roles,
  RolesGuard,
  SignupCompletedGuard,
  customerWelperRoleForAuthUser,
} from '../../common/auth';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { BookingService } from './booking.service';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { BookingListQueryDto } from './dto/booking-list-query.dto';
import { DeclineBookingDto, CancelBookingDto } from './dto/update-booking-status.dto';
import { SubmitServiceReceiptDto } from './dto/submit-service-receipt.dto';
import {
  ConfirmServiceReceiptResponseDto,
  ServiceReceiptDraftDto,
} from './dto/service-receipt.dto';

interface AuthUser {
  userId: string;
  email: string;
  accountType: string;
  effectiveRole?: string;
}

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, SignupCompletedGuard)
@ApiBearerAuth('JWT-auth')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ─── List & Detail ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List bookings for current user (with filters)' })
  @ApiResponse({ status: 200, description: 'Paginated list of bookings' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: BookingListQueryDto,
  ) {
    return this.bookingService.findAll(
      user.userId,
      customerWelperRoleForAuthUser(user),
      query,
    );
  }

  @Get(':id/service-receipt')
  @ApiOperation({ summary: 'Draft or confirmed service receipt (welper in progress, or either party after confirm)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Receipt draft or confirmed snapshot' })
  async getServiceReceiptDraft(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
  ): Promise<ServiceReceiptDraftDto> {
    return this.bookingService.getServiceReceiptDraft(
      bookingId,
      user.userId,
      customerWelperRoleForAuthUser(user),
    );
  }

  @Post(':id/service-receipt')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Welper confirms service receipt (billing times, charge customer)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking completed, receipt stored, payment captured',
    type: ConfirmServiceReceiptResponseDto,
  })
  async submitServiceReceipt(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
    @Body() dto: SubmitServiceReceiptDto,
  ): Promise<ConfirmServiceReceiptResponseDto> {
    return this.bookingService.submitServiceReceipt(bookingId, user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getById(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.findById(
      bookingId,
      user.userId,
      customerWelperRoleForAuthUser(user),
    );
  }

  // ─── Create ───────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a booking request (customers only)' })
  @ApiResponse({ status: 201, description: 'Booking request created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Only customers can create bookings' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingRequestDto,
  ) {
    return this.bookingService.create(user.userId, dto);
  }

  @Post(':id/payment-intent')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authorize payment (manual capture) for accepted booking',
    description:
      'Normally payment is authorized automatically when the welper accepts. Use this to complete 3DS or recover legacy bookings.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'PaymentIntent created or reused' })
  async createPaymentIntent(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.createPaymentIntentForBooking(
      bookingId,
      user.userId,
      customerWelperRoleForAuthUser(user),
    );
  }

  // ─── Welper Actions ───────────────────────────────────────────────────

  @Patch(':id/accept')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Welper accepts a booking request' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking accepted' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Not authorized (not the welper)' })
  async accept(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.accept(
      bookingId,
      user.userId,
      customerWelperRoleForAuthUser(user),
    );
  }

  @Patch(':id/decline')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Welper declines a booking request' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking declined' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Not authorized (not the welper)' })
  async decline(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
    @Body() dto: DeclineBookingDto,
  ) {
    return this.bookingService.decline(bookingId, user.userId, dto.reason);
  }

  @Patch(':id/check-in')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Welper checks in (starts service)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Service started' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Not authorized (not the welper)' })
  async checkIn(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.checkIn(bookingId, user.userId);
  }

  @Patch(':id/check-out')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Welper checks out (legacy)',
    description: 'Same as submitting a service receipt with default billing times (check-in from booking, check-out now). Prefer POST /service-receipt with explicit times.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Service completed' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Not authorized (not the welper)' })
  async checkOut(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.checkOut(bookingId, user.userId);
  }

  // ─── Shared Actions ───────────────────────────────────────────────────

  @Patch(':id/cancel')
  @UseGuards(EmailVerifiedGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking (customer or welper)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancel(
      bookingId,
      user.userId,
      customerWelperRoleForAuthUser(user),
      dto.reason,
      dto.timezoneOffsetMinutes,
    );
  }
}
