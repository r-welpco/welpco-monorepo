import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { CurrentUser, JwtAuthGuard } from '../../../common/auth';

@ApiTags('Referrals')
@Controller('referrals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('code')
  @ApiOperation({ summary: "Get user's referral code" })
  @ApiResponse({
    status: 200,
    description: 'Referral code retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        code: { type: 'string' },
        isActive: { type: 'boolean' },
        expiresAt: { type: 'string', nullable: true },
      },
    },
  })
  async getReferralCode(@CurrentUser() user: { userId: string }) {
    const code = await this.referralService.getReferralCode(user.userId);
    if (!code) {
      // Generate if doesn't exist
      return this.referralService.generateReferralCode(user.userId);
    }
    return code;
  }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply referral code during registration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Referral code applied successfully',
  })
  @ApiResponse({ status: 404, description: 'Invalid referral code' })
  async applyReferralCode(
    @CurrentUser() user: { userId: string },
    @Body() body: { code: string },
  ) {
    return this.referralService.applyReferralCode(body.code, user.userId);
  }

  @Get()
  @ApiOperation({ summary: "Get user's referral history" })
  @ApiResponse({
    status: 200,
    description: 'Referral history retrieved successfully',
  })
  async getReferralHistory(@CurrentUser() user: { userId: string }) {
    return this.referralService.getReferralHistory(user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: "Get user's referral statistics" })
  @ApiResponse({
    status: 200,
    description: 'Referral statistics retrieved successfully',
  })
  async getReferralStats(@CurrentUser() user: { userId: string }) {
    return this.referralService.getReferralStats(user.userId);
  }
}

