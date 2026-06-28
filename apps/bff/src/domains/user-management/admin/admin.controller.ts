import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  AdminService,
  ADMIN_WELPER_DISTRIBUTION_SCOPES,
  type AdminWelperDistributionScope,
} from './admin.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { UpdateBackgroundCheckDto, UpdateUserAccountStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../common/auth';
import { AccountType, AccountStatus, UserAccount } from '../entities/user-account.entity';
import { BackgroundCheckStatus } from '../entities/verification-status.entity';
import { AccountLockoutService } from '../auth/account-lockout.service';
import { PayoutBatchService } from '../../payment/payout-batch.service';
import { StripeOperationsService } from '../../payment/stripe-operations.service';
import { ApplicationSettingsService, PAYMENT_CAPTURE_DELAY_KEY } from '../../payment/application-settings.service';
import { CurrentUser, CurrentUserData } from '../../../common/auth/decorators/current-user.decorator';
import { BookingService } from '../../booking/booking.service';
import { SupportTicketService } from '../../dispute/support-ticket.service';
import { AdminAuditService } from './admin-audit.service';
import { BookingRequestStatus } from '../../booking/entities/booking-request.entity';
import { UpdateSupportTicketAdminDto } from '../../dispute/dto/update-support-ticket-admin.dto';
import { JobPostingService } from '../../job-posting/job-posting.service';
import { AdminJobPostingListQueryDto } from '../../job-posting/dto/job-posting-query.dto';

function sanitizeAdminUser(user: UserAccount): Omit<UserAccount, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

function parseOptionalBoolean(value?: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(AccountType.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminDashboardService: AdminDashboardService,
    private readonly accountLockoutService: AccountLockoutService,
    private readonly applicationSettingsService: ApplicationSettingsService,
    private readonly bookingService: BookingService,
    private readonly supportTicketService: SupportTicketService,
    private readonly adminAuditService: AdminAuditService,
    private readonly jobPostingService: JobPostingService,
    private readonly payoutBatchService: PayoutBatchService,
    private readonly stripeOperationsService: StripeOperationsService,
  ) {}

  @Get('reports/welper-distribution')
  @ApiOperation({ summary: 'Aggregate welper distribution by service area' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ADMIN_WELPER_DISTRIBUTION_SCOPES,
  })
  @ApiQuery({ name: 'status', enum: AccountStatus, required: false })
  @ApiQuery({ name: 'signupCompleted', type: Boolean, required: false })
  @ApiQuery({ name: 'emailVerified', type: Boolean, required: false })
  @ApiQuery({
    name: 'backgroundCheckStatus',
    enum: BackgroundCheckStatus,
    required: false,
  })
  @ApiQuery({ name: 'serviceCategoryId', required: false })
  @ApiQuery({ name: 'serviceSubcategoryId', required: false })
  @ApiQuery({ name: 'provinceCode', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiResponse({
    status: 200,
    description: 'Welper distribution summary and aggregate area buckets',
  })
  async getWelperDistributionReport(
    @Query('scope') scope?: string,
    @Query('status') status?: AccountStatus,
    @Query('signupCompleted') signupCompleted?: string,
    @Query('emailVerified') emailVerified?: string,
    @Query('backgroundCheckStatus')
    backgroundCheckStatus?: BackgroundCheckStatus,
    @Query('serviceCategoryId') serviceCategoryId?: string,
    @Query('serviceSubcategoryId') serviceSubcategoryId?: string,
    @Query('provinceCode') provinceCode?: string,
    @Query('city') city?: string,
  ) {
    const resolvedScope = ADMIN_WELPER_DISTRIBUTION_SCOPES.includes(
      scope as AdminWelperDistributionScope,
    )
      ? (scope as AdminWelperDistributionScope)
      : undefined;
    const resolvedStatus =
      status && Object.values(AccountStatus).includes(status) ? status : undefined;
    const resolvedBackgroundCheckStatus =
      backgroundCheckStatus &&
      Object.values(BackgroundCheckStatus).includes(backgroundCheckStatus)
        ? backgroundCheckStatus
        : undefined;

    return this.adminService.getWelperDistributionReport({
      scope: resolvedScope,
      status: resolvedStatus,
      signupCompleted: parseOptionalBoolean(signupCompleted),
      emailVerified: parseOptionalBoolean(emailVerified),
      backgroundCheckStatus: resolvedBackgroundCheckStatus,
      serviceCategoryId: serviceCategoryId?.trim() || undefined,
      serviceSubcategoryId: serviceSubcategoryId?.trim() || undefined,
      provinceCode: provinceCode?.trim() || undefined,
      city: city?.trim() || undefined,
    });
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  @ApiQuery({ name: 'accountType', enum: AccountType, required: false })
  @ApiQuery({ name: 'status', enum: AccountStatus, required: false })
  @ApiQuery({ name: 'emailVerified', type: Boolean, required: false })
  @ApiQuery({ name: 'signupCompleted', type: Boolean, required: false })
  @ApiQuery({
    name: 'discoverable',
    type: Boolean,
    required: false,
    description:
      'Welper only: true = finished go-live setup and ready for search/jobs',
  })
  @ApiQuery({
    name: 'backgroundCheckStatus',
    enum: BackgroundCheckStatus,
    required: false,
  })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filter by user id (UUID) or partial email (case-insensitive)',
  })
  @ApiQuery({
    name: 'provinceCode',
    required: false,
    description: 'Welper only: filter by service area province code',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Welper only: filter by service area city',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'email', 'status', 'lastLoginAt', 'signupSteps'],
  })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'List of users',
  })
  async findAll(
    @Query('accountType') accountType?: AccountType,
    @Query('status') status?: AccountStatus,
    @Query('emailVerified') emailVerified?: string,
    @Query('signupCompleted') signupCompleted?: string,
    @Query('discoverable') discoverable?: string,
    @Query('backgroundCheckStatus')
    backgroundCheckStatus?: BackgroundCheckStatus,
    @Query('search') search?: string,
    @Query('provinceCode') provinceCode?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    const bgStatus =
      backgroundCheckStatus && Object.values(BackgroundCheckStatus).includes(backgroundCheckStatus)
        ? backgroundCheckStatus
        : undefined;
    const allowedSortBy = ['createdAt', 'email', 'status', 'lastLoginAt', 'signupSteps'] as const;
    const resolvedSortBy =
      sortBy && allowedSortBy.includes(sortBy as (typeof allowedSortBy)[number])
        ? (sortBy as (typeof allowedSortBy)[number])
        : undefined;
    const resolvedSortDir = sortDir === 'asc' || sortDir === 'desc' ? sortDir : undefined;

    const result = await this.adminService.findAll({
      accountType,
      status,
      emailVerified: emailVerified === 'true' ? true : emailVerified === 'false' ? false : undefined,
      signupCompleted: signupCompleted === 'true' ? true : signupCompleted === 'false' ? false : undefined,
      discoverable:
        discoverable === 'true' ? true : discoverable === 'false' ? false : undefined,
      backgroundCheckStatus: bgStatus,
      search: search?.trim() || undefined,
      provinceCode: provinceCode?.trim() || undefined,
      city: city?.trim() || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy: resolvedSortBy,
      sortDir: resolvedSortDir,
    });
    return {
      users: result.users.map((u) => sanitizeAdminUser(u)),
      total: result.total,
    };
  }

  @Get('users/:id/signup-state')
  @ApiOperation({
    summary: 'Get signup wizard progress for a user (read-only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Signup state summary' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserSignupState(@Param('id') id: string) {
    return this.adminService.getSignupStateForAdmin(id);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.adminService.findOne(id);
    const [backgroundCheck, profilePhotoUrl] = await Promise.all([
      this.adminService.getBackgroundCheckExtras(id),
      this.adminService.getProfilePhotoUrlForUser(id),
    ]);
    return {
      ...sanitizeAdminUser(user),
      ...backgroundCheck,
      profilePhotoUrl,
    };
  }

  @Put('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user account status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Account status updated',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(
    @CurrentUser() actor: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateUserAccountStatusDto,
  ) {
    const { user, previousStatus } = await this.adminService.updateAccountStatusFromAdmin(actor.userId, id, dto);
    await this.adminAuditService.record(actor.userId, 'admin.user.status', {
      targetUserId: id,
      status: dto.status,
      previousStatus,
      reasonCode: dto.reasonCode ?? null,
      reasonDetail: dto.reasonDetail ?? null,
    });
    return sanitizeAdminUser(user);
  }

  @Put('users/:id/background-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set background check status for Welper account',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Background check status updated',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 400,
    description: 'Background check can only be set for Welper accounts',
  })
  async setBackgroundCheck(
    @CurrentUser() actor: CurrentUserData,
    @Param('id') id: string,
    @Body() updateDto: UpdateBackgroundCheckDto,
  ) {
    const result = await this.adminService.setBackgroundCheckStatus(id, updateDto.status);
    await this.adminAuditService.record(actor.userId, 'admin.user.background_check', {
      targetUserId: id,
      status: updateDto.status,
    });
    return result;
  }

  @Post('users/:id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock locked account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Account unlocked',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unlockAccount(@CurrentUser() actor: CurrentUserData, @Param('id') id: string) {
    const user = await this.adminService.findOne(id);
    // Clear lockout for the user's email
    await this.accountLockoutService.clearFailedAttempts(user.email);
    await this.adminAuditService.record(actor.userId, 'admin.user.unlock', {
      targetUserId: id,
      email: user.email,
    });
    return { message: 'Account unlocked successfully' };
  }

  @Get('users/:id/profile')
  @ApiOperation({ summary: 'Get user profile info (customer or welper)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile info' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('id') id: string) {
    return this.adminService.getUserProfile(id);
  }

  @Put('users/:id/profile-flags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set profile completion status and/or onboarding flag',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile flags updated' })
  @ApiResponse({ status: 404, description: 'User or profile not found' })
  async setProfileFlags(
    @CurrentUser() actor: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { profileComplete?: boolean; onboardingCompleted?: boolean },
  ) {
    const result = await this.adminService.setProfileFlags(id, body);
    await this.adminAuditService.record(actor.userId, 'admin.user.profile_flags', {
      targetUserId: id,
      ...result,
    });
    return result;
  }

  @Get('users/:id/offerings')
  @ApiOperation({ summary: 'Get service offerings for a welper user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserOfferings(@Param('id') id: string) {
    return this.adminService.getWelperOfferings(id);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'revieweeId', required: false })
  @ApiQuery({ name: 'reviewerType', required: false })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  async listReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('revieweeId') revieweeId?: string,
    @Query('reviewerType') reviewerType?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
  ) {
    return this.adminService.listReviews({
      page,
      limit,
      revieweeId,
      reviewerType,
      minRating: minRating ? parseInt(minRating, 10) : undefined,
      maxRating: maxRating ? parseInt(maxRating, 10) : undefined,
    });
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review (admin moderation)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async deleteReview(@CurrentUser() actor: CurrentUserData, @Param('id') id: string) {
    await this.adminService.deleteReview(id);
    await this.adminAuditService.record(actor.userId, 'admin.review.delete', {
      reviewId: id,
    });
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List notifications (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'category', required: false })
  async listNotifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('channel') channel?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.listNotifications({
      page,
      limit,
      userId,
      channel,
      category,
    });
  }

  @Get('referrals')
  @ApiOperation({ summary: 'List referrals (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  async listReferrals(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.listReferrals({ page, limit, status });
  }

  @Get('referrals/stats')
  @ApiOperation({ summary: 'Referral program statistics' })
  async getReferralStats() {
    return this.adminService.getReferralStats();
  }

  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin-initiated booking cancellation' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async adminCancelBooking(
    @CurrentUser() actor: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const result = await this.bookingService.cancelByAdmin(id, actor.userId, body.reason);
    await this.adminAuditService.record(actor.userId, 'admin.booking.cancel', {
      bookingId: id,
      reason: body.reason,
    });
    return result;
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create admin user account' })
  async createAdminUser(@CurrentUser() actor: CurrentUserData, @Body() body: { email: string; password: string }) {
    const user = await this.adminService.createAdminUser(body.email, body.password);
    await this.adminAuditService.record(actor.userId, 'admin.user.create', {
      targetUserId: user.id,
      email: user.email,
    });
    return sanitizeAdminUser(user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({
    status: 200,
    description: 'Platform statistics',
  })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Aggregated dashboard snapshot (users, disputes, tickets, bookings, payments)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard snapshot' })
  async getDashboard() {
    return this.adminDashboardService.getSnapshot();
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Search bookings (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'welperId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BookingRequestStatus })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'YYYY-MM-DD scheduled_date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'YYYY-MM-DD scheduled_date',
  })
  async listBookings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('customerId') customerId?: string,
    @Query('welperId') welperId?: string,
    @Query('status') status?: BookingRequestStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.bookingService.findAllForAdmin({
      page,
      limit,
      customerId,
      welperId,
      status,
      dateFrom,
      dateTo,
    });
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get booking by ID (admin read-only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@Param('id') id: string) {
    return this.bookingService.findByIdForAdmin(id);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List job postings (admin read-only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'subcategoryId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async listJobs(@Query() query: AdminJobPostingListQueryDto) {
    return this.jobPostingService.adminList(query);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job posting by ID (admin read-only)' })
  @ApiParam({ name: 'id', description: 'Job posting ID' })
  async getJob(@Param('id') id: string) {
    return this.jobPostingService.adminFindById(id);
  }

  @Get('support-tickets')
  @ApiOperation({ summary: 'List all support tickets (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  async listSupportTickets(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.supportTicketService.findAllForAdmin(page, limit, status);
  }

  @Get('support-tickets/:id')
  @ApiOperation({ summary: 'Get support ticket by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  async getSupportTicket(@Param('id') id: string) {
    return this.supportTicketService.findByIdForAdmin(id);
  }

  @Patch('support-tickets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update support ticket triage fields (admin)' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  async patchSupportTicket(
    @CurrentUser() actor: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketAdminDto,
  ) {
    const { ticket, changes } = await this.supportTicketService.updateForAdmin(id, dto);
    await this.adminAuditService.record(actor.userId, 'admin.support_ticket.update', {
      ticketId: id,
      changes,
    });
    return ticket;
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Recent admin audit log entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminAuditService.findPage(page, limit);
  }

  @Get('payouts/upcoming')
  @ApiOperation({ summary: 'Preview upcoming Friday welper payout batch' })
  async getPayoutUpcoming() {
    return this.payoutBatchService.getUpcomingPreview();
  }

  @Get('payouts/recoveries')
  @ApiOperation({ summary: 'List open Stripe transfer recovery tasks' })
  async listPayoutRecoveries() {
    return { data: await this.stripeOperationsService.listOpenRecoveryTasks() };
  }

  @Get('payouts/batches')
  @ApiOperation({ summary: 'List welper payout batches' })
  @ApiQuery({
    name: 'payoutFriday',
    required: false,
    description: 'YYYY-MM-DD (Toronto)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listPayoutBatches(
    @Query('payoutFriday') payoutFriday?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const batches = await this.payoutBatchService.listBatches(limit, payoutFriday?.trim() || undefined);
    return { data: batches };
  }

  @Get('payouts/batches/:id')
  @ApiOperation({ summary: 'Full payout batch review payload' })
  @ApiParam({ name: 'id', description: 'Payout batch ID' })
  async getPayoutBatch(@Param('id') id: string) {
    return this.payoutBatchService.getBatchReview(id);
  }

  @Post('payouts/batches/build')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build or refresh draft payout batch for a Friday' })
  async buildPayoutBatch(@CurrentUser() actor: CurrentUserData, @Body('payoutFriday') payoutFriday?: string) {
    const batch = await this.payoutBatchService.buildDraftBatch(payoutFriday?.trim() || undefined);
    await this.adminAuditService.record(actor.userId, 'admin.payout_batch.build', {
      batchId: batch.id,
      payoutFriday: batch.payoutFriday,
      bookingCount: batch.bookingCount,
      welperCount: batch.welperCount,
      totalWelperNetCents: batch.totalWelperNetCents,
    });
    return batch;
  }

  @Post('payouts/refresh-pending-fees')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry Stripe fee lookup for payout lines excluded as stripe_fee_pending',
  })
  async refreshPendingPayoutFees(@CurrentUser() actor: CurrentUserData) {
    const result = await this.payoutBatchService.refreshPendingStripeFees();
    await this.adminAuditService.record(actor.userId, 'admin.payout_fees.refresh', result);
    return result;
  }

  @Post('payouts/batches/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve payout batch and execute Stripe Connect transfers',
  })
  @ApiParam({ name: 'id', description: 'Payout batch ID' })
  async approvePayoutBatch(@CurrentUser() actor: CurrentUserData, @Param('id') id: string) {
    const batch = await this.payoutBatchService.approveAndExecute(id, actor.userId);
    await this.adminAuditService.record(actor.userId, 'admin.payout_batch.approve', {
      batchId: batch.id,
      payoutFriday: batch.payoutFriday,
      status: batch.status,
      totalWelperNetCents: batch.totalWelperNetCents,
      welperCount: batch.welperCount,
    });
    return batch;
  }

  @Get('payouts/batches/:id/export')
  @ApiOperation({ summary: 'Export payout batch as CSV for finance' })
  @ApiParam({ name: 'id', description: 'Payout batch ID' })
  async exportPayoutBatch(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.payoutBatchService.exportBatchCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="welpco-payout-${id}.csv"`);
    res.send(csv);
  }

  @Get('settings/payment_capture_delay_minutes')
  @ApiOperation({
    summary: 'Get payment capture delay (minutes after service completion)',
  })
  async getCaptureDelay() {
    const minutes = await this.applicationSettingsService.getPaymentCaptureDelayMinutes();
    return { key: PAYMENT_CAPTURE_DELAY_KEY, value: minutes };
  }

  @Put('settings/payment_capture_delay_minutes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update payment capture delay (minutes after service completion)',
  })
  async setCaptureDelay(@CurrentUser() actor: CurrentUserData, @Body('value') value: string) {
    await this.applicationSettingsService.setValue(PAYMENT_CAPTURE_DELAY_KEY, String(value));
    await this.adminAuditService.record(actor.userId, 'admin.settings.payment_capture_delay_minutes', {
      value: String(value),
    });
    return { ok: true, key: PAYMENT_CAPTURE_DELAY_KEY, value: String(value) };
  }
}
