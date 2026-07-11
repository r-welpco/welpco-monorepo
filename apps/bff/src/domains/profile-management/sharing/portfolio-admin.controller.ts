import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../../../common/auth';
import { CurrentUser, CurrentUserData } from '../../../common/auth/decorators/current-user.decorator';
import { AccountType } from '../../user-management/entities/user-account.entity';
import { AdminAuditService } from '../../user-management/admin/admin-audit.service';
import { PortfolioService, AdminPortfolioPhotoListResult } from './portfolio.service';
import { PortfolioPhotoStatus } from '../entities/portfolio-photo-status.enum';
import { ModeratePortfolioPhotoDto, PortfolioPhotoResponseDto } from './dto';

/** Map the ?status= query to the enum; undefined = all statuses. */
function parseStatusFilter(status?: string): PortfolioPhotoStatus | undefined {
  const v = status?.trim().toLowerCase();
  if (v === 'pending') return PortfolioPhotoStatus.PENDING;
  if (v === 'approved') return PortfolioPhotoStatus.APPROVED;
  if (v === 'rejected') return PortfolioPhotoStatus.REJECTED;
  return undefined;
}

/**
 * SHARE-001 / SHARE-00M (BFF half): admin moderation queue for portfolio
 * photos. Mutations are audit-logged like the other admin actions
 * (`admin.controller.ts` pattern); rejection emits a preference-aware
 * notification to the welper.
 */
@ApiTags('Admin')
@Controller('admin/portfolio-photos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountType.ADMIN)
@ApiBearerAuth()
export class PortfolioAdminController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List portfolio photos for moderation (default: pending)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated photos with welper name, caption, url, createdAt' })
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ): Promise<AdminPortfolioPhotoListResult> {
    const statusFilter = status === 'all' ? undefined : (parseStatusFilter(status) ?? PortfolioPhotoStatus.PENDING);
    return this.portfolioService.listForAdmin(
      statusFilter,
      Math.max(1, page),
      Math.min(100, Math.max(1, limit)),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve or reject a portfolio photo',
    description: 'Rejection notifies the welper (in-app, preference-aware) with the optional reason.',
  })
  @ApiParam({ name: 'id', description: 'Portfolio photo ID' })
  @ApiResponse({ status: 200, description: 'Photo moderated', type: PortfolioPhotoResponseDto })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async moderate(
    @CurrentUser() actor: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: ModeratePortfolioPhotoDto,
  ): Promise<PortfolioPhotoResponseDto> {
    const result = await this.portfolioService.moderate(id, dto);
    await this.adminAuditService.record(actor.userId, 'admin.portfolio_photo.moderate', {
      photoId: id,
      welperId: result.welperId,
      status: dto.status,
      rejectionReason: dto.rejectionReason ?? null,
    });
    return result;
  }
}
