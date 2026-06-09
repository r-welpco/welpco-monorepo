import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, SignupCompletedGuard } from '../../common/auth';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';
import { AccountType } from '../user-management/entities/user-account.entity';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import {
  DisputeEvidencePresignRequestDto,
  DisputeEvidencePresignResponseDto,
} from './dto/dispute-evidence-presign.dto';
import { DisputeResponseDto } from './dto/dispute-response.dto';
import { CreateResolutionDto } from './dto/create-resolution.dto';
import { CreateResolutionResponseDto } from './dto/create-resolution-response.dto';

/** Map query param (API style) to DB dispute status; returns undefined if invalid. */
function disputeStatusQueryToDb(q: string): string | undefined {
  const v = q.trim().toLowerCase();
  if (v === 'in-review' || v === 'in_review') return 'in_review';
  const allowed = ['open', 'resolved', 'closed', 'escalated'];
  if (allowed.includes(v)) return v;
  return undefined;
}

@ApiTags('Disputes')
@Controller()
@UseGuards(JwtAuthGuard, SignupCompletedGuard)
@ApiBearerAuth('JWT-auth')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  /**
   * DISPUTES-001 (Day 16): mints a presigned PUT URL for evidence files.
   * Declared BEFORE `disputes/:id/...` matchers so `evidence` doesn't get
   * routed as a dispute id. Auth-required; the resulting key is namespaced
   * by `userId` so a stolen URL can't write into another user's namespace.
   */
  @Post('disputes/evidence/presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a presigned PUT URL for dispute evidence upload',
    description:
      'Returns a short-lived (15 min) S3 PUT URL plus the key to submit alongside the dispute create payload. Validates content-type (image/jpeg, image/png, image/webp, image/heic, application/pdf) and size (≤10MB).',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL minted',
    type: DisputeEvidencePresignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid content-type or size' })
  @ApiResponse({ status: 503, description: 'Evidence storage not configured' })
  async presignEvidenceUpload(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: DisputeEvidencePresignRequestDto,
  ): Promise<DisputeEvidencePresignResponseDto> {
    return this.disputeService.presignEvidenceUpload(user.userId, dto);
  }

  @Post('bookings/:bookingId/disputes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'File a dispute for a booking (transitions booking to disputed)',
  })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 201, description: 'Dispute created' })
  @ApiResponse({
    status: 400,
    description: 'Booking status does not allow dispute',
  })
  @ApiResponse({
    status: 403,
    description: 'Not a participant of this booking',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({
    status: 409,
    description: 'Booking already has an open dispute',
  })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateDisputeDto,
  ): Promise<DisputeResponseDto> {
    return this.disputeService.create(bookingId, user.userId, user.effectiveRole, dto);
  }

  @Get('bookings/:bookingId/dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dispute for this booking (if any)' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispute if exists, or null if none filed',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getByBooking(
    @CurrentUser() user: CurrentUserData,
    @Param('bookingId') bookingId: string,
  ): Promise<{ dispute: DisputeResponseDto | null }> {
    const dispute = await this.disputeService.findByBooking(bookingId, user.userId);
    return { dispute };
  }

  @Get('disputes')
  @ApiOperation({
    summary: 'List disputes',
    description:
      'Customers and welpers see disputes where they are the booking participant. Admins see all disputes. Admins may filter by status (open, in-review, escalated, resolved, closed).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Admin only: filter by dispute status (API form: in-review, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Paginated disputes' })
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    const statusDb = user.effectiveRole === 'admin' && status ? disputeStatusQueryToDb(status) : undefined;
    return this.disputeService.findMine(user.userId, user.effectiveRole, page, limit, statusDb);
  }

  @Get('disputes/:id')
  @ApiOperation({
    summary: 'Get dispute by ID',
    description: 'Participants see their booking disputes; admins may view any dispute.',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({ status: 200, description: 'Dispute details' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async getById(@CurrentUser() user: CurrentUserData, @Param('id') id: string): Promise<DisputeResponseDto> {
    return this.disputeService.findById(id, user.userId, user.effectiveRole);
  }

  /**
   * Wave 2 (BFF): the original filer withdraws their dispute before admin
   * resolves it. Only the filer; only while withdrawable. Soft-status change
   * — the dispute row stays at status `withdrawn`, not deleted.
   */
  @Delete('disputes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Withdraw an open dispute (filer only)',
    description:
      'The original filer of a dispute may withdraw it while it is still open or in_review. Once admin escalates or resolves the dispute, the participant cannot withdraw — contact support instead. Returns the dispute with `status: "withdrawn"`. The associated booking is restored to COMPLETED if it was sitting in DISPUTED.',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispute withdrawn',
    type: DisputeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dispute is no longer withdrawable',
  })
  @ApiResponse({ status: 403, description: 'Only the filer can withdraw' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async withdraw(@CurrentUser() user: CurrentUserData, @Param('id') id: string): Promise<DisputeResponseDto> {
    return this.disputeService.withdraw(id, user.userId);
  }

  @Post('disputes/:id/resolution')
  @UseGuards(RolesGuard)
  @Roles(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create resolution for a dispute (admin/support)',
    description:
      'Marks dispute resolved and transitions booking from disputed to completed (default) or cancelled (bookingOutcome).',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 201,
    description: 'Resolution created; booking status updated',
    type: CreateResolutionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dispute not resolvable or booking not disputed',
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 409, description: 'Resolution already exists' })
  async createResolution(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: CreateResolutionDto,
  ): Promise<CreateResolutionResponseDto> {
    return this.disputeService.createResolution(id, user.userId, dto);
  }

  @Post('disputes/:id/resolution/refund/retry')
  @UseGuards(RolesGuard)
  @Roles(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry a failed or partial Stripe refund for an existing resolution',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async retryResolutionRefund(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.disputeService.retryResolutionRefund(id, user.userId);
  }
}
