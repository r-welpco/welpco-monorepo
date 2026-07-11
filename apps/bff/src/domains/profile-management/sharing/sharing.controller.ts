import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../../../common/auth';
import { CurrentUser, CurrentUserData } from '../../../common/auth/decorators/current-user.decorator';
import { HandleService } from './handle.service';
import { ProfileViewsService } from './profile-views.service';
import {
  ClaimHandleDto,
  ClaimHandleResponseDto,
  ProfileViewStatsResponseDto,
} from './dto';

/**
 * SHARE-002 + SHARE-005 welper-facing routes under `profiles/me`.
 * (The public halves — by-handle resolve + the view ping — live in the
 * service-discovery controller, which is guard-free.)
 */
@ApiTags('Profile Sharing')
@Controller('profiles/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('welper')
@ApiBearerAuth('JWT-auth')
export class SharingController {
  constructor(
    private readonly handleService: HandleService,
    private readonly profileViewsService: ProfileViewsService,
  ) {}

  @Post('handle')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Claim a vanity handle (set-once)',
    description:
      'Lowercase `^[a-z0-9][a-z0-9-]{2,29}$`, reserved words rejected. 409 HANDLE_ALREADY_SET when the profile has one, 409 HANDLE_TAKEN/HANDLE_RESERVED otherwise.',
  })
  @ApiResponse({ status: 201, description: 'Handle claimed', type: ClaimHandleResponseDto })
  @ApiResponse({ status: 400, description: 'INVALID_HANDLE — regex failure' })
  @ApiResponse({ status: 409, description: 'HANDLE_ALREADY_SET | HANDLE_TAKEN | HANDLE_RESERVED' })
  async claimHandle(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ClaimHandleDto,
  ): Promise<ClaimHandleResponseDto> {
    return this.handleService.claimHandle(user.userId, dto.handle);
  }

  @Get('profile-views')
  @ApiOperation({
    summary: 'Own profile-view stats: totals by src + last-30-days total',
  })
  @ApiResponse({ status: 200, description: 'View stats', type: ProfileViewStatsResponseDto })
  async getProfileViews(@CurrentUser() user: CurrentUserData): Promise<ProfileViewStatsResponseDto> {
    return this.profileViewsService.getStatsForWelper(user.userId);
  }
}
