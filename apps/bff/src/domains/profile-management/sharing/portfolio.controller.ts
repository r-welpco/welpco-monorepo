import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../../../common/auth';
import { CurrentUser, CurrentUserData } from '../../../common/auth/decorators/current-user.decorator';
import { PortfolioService } from './portfolio.service';
import {
  CreatePortfolioPhotoDto,
  PortfolioPhotoResponseDto,
  PortfolioPresignRequestDto,
  PortfolioPresignResponseDto,
  ReorderPortfolioDto,
  UpdatePortfolioPhotoDto,
} from './dto';

/**
 * SHARE-001: welper-facing portfolio CRUD. Every route operates on the
 * CALLER's portfolio only (`profiles/me/…`) — ownership is welper-id-scoped
 * in the service, so there is no cross-welper id surface here.
 */
@ApiTags('Welper Portfolio')
@Controller('profiles/me/portfolio')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('welper')
@ApiBearerAuth('JWT-auth')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a presigned PUT URL for a portfolio photo upload',
    description:
      'Returns a short-lived (15 min) S3 PUT URL. Images only (jpeg/png/webp/heic), ≤10 MB, key namespaced `portfolio/{welperId}/…`. Mirrors the dispute-evidence presign pattern.',
  })
  @ApiResponse({ status: 200, description: 'Presigned URL minted', type: PortfolioPresignResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid content-type or size' })
  @ApiResponse({ status: 503, description: 'Photo storage not configured' })
  async presignUpload(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PortfolioPresignRequestDto,
  ): Promise<PortfolioPresignResponseDto> {
    return this.portfolioService.presignUpload(user.userId, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register an uploaded portfolio photo (status starts at pending)',
  })
  @ApiResponse({ status: 201, description: 'Photo registered, pending moderation', type: PortfolioPhotoResponseDto })
  @ApiResponse({ status: 400, description: 'Key outside your namespace (INVALID_S3_KEY) or bad offering (OFFERING_NOT_FOUND)' })
  @ApiResponse({ status: 409, description: 'PORTFOLIO_LIMIT_REACHED — 24-photo cap' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePortfolioPhotoDto,
  ): Promise<PortfolioPhotoResponseDto> {
    return this.portfolioService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List own portfolio photos (all statuses, with rejectionReason)',
  })
  @ApiResponse({ status: 200, description: 'Own photos ordered by sortOrder', type: [PortfolioPhotoResponseDto] })
  async listOwn(@CurrentUser() user: CurrentUserData): Promise<PortfolioPhotoResponseDto[]> {
    return this.portfolioService.listOwn(user.userId);
  }

  /**
   * Declared BEFORE `:photoId` so "reorder" doesn't get routed as a photo id.
   */
  @Patch('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder portfolio photos by ordered id list' })
  @ApiResponse({ status: 200, description: 'Photos in new order', type: [PortfolioPhotoResponseDto] })
  @ApiResponse({ status: 400, description: 'INVALID_PHOTO_IDS — an id is unknown or not yours' })
  async reorder(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ReorderPortfolioDto,
  ): Promise<PortfolioPhotoResponseDto[]> {
    return this.portfolioService.reorder(user.userId, dto);
  }

  @Patch(':photoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a photo caption and/or sort position' })
  @ApiParam({ name: 'photoId', description: 'Portfolio photo ID' })
  @ApiResponse({ status: 200, description: 'Photo updated', type: PortfolioPhotoResponseDto })
  @ApiResponse({ status: 404, description: 'Photo not found (or not yours)' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('photoId') photoId: string,
    @Body() dto: UpdatePortfolioPhotoDto,
  ): Promise<PortfolioPhotoResponseDto> {
    return this.portfolioService.update(user.userId, photoId, dto);
  }

  @Delete(':photoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a portfolio photo' })
  @ApiParam({ name: 'photoId', description: 'Portfolio photo ID' })
  @ApiResponse({ status: 200, description: 'Photo deleted' })
  @ApiResponse({ status: 404, description: 'Photo not found (or not yours)' })
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('photoId') photoId: string,
  ): Promise<{ deleted: true }> {
    return this.portfolioService.remove(user.userId, photoId);
  }
}
