import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';
import { GuardianConsentService } from './guardian-consent.service';
import { SubmitGuardianRequestDto } from './dto/submit-guardian-request.dto';
import { ApproveGuardianConsentDto } from './dto/approve-guardian-consent.dto';

@ApiTags('Verification')
@Controller('verification/guardian')
export class GuardianConsentController {
  constructor(private readonly guardianConsentService: GuardianConsentService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Guardian consent status for current minor welper' })
  async getStatus(@CurrentUser() user: CurrentUserData) {
    return this.guardianConsentService.getStatus(user.userId);
  }

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit guardian contact info and send review email' })
  async submitRequest(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SubmitGuardianRequestDto,
  ) {
    return this.guardianConsentService.submitRequest(user.userId, dto);
  }

  @Post('resend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend guardian review email' })
  async resend(@CurrentUser() user: CurrentUserData) {
    return this.guardianConsentService.resendEmail(user.userId);
  }

  @Get('review')
  @ApiOperation({ summary: 'Public preview for guardian review link' })
  async getReview(@Query('token') token: string) {
    return this.guardianConsentService.getReviewPreview(token ?? '');
  }

  @Post('approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public guardian approval via token' })
  async approve(
    @Body() dto: ApproveGuardianConsentDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent?: string,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      undefined;
    return this.guardianConsentService.approveByToken(dto.token, {
      ipAddress,
      userAgent,
    });
  }
}
