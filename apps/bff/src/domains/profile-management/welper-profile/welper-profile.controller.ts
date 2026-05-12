import {
  Controller,
  Put,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { WelperProfileService } from './welper-profile.service';
import { UpdateWelperProfileDto } from './dto/update-welper-profile.dto';
import { WelperProfileResponseDto } from './dto/welper-profile-response.dto';
import { CurrentUser, JwtAuthGuard } from '../../../common/auth';

@ApiTags('Welper Profile')
@Controller('profiles/welper')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WelperProfileController {
  constructor(private readonly welperProfileService: WelperProfileService) {}

  @Put(':welperId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Welper profile' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiResponse({
    status: 200,
    description: 'Welper profile updated successfully',
    type: WelperProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Welper profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your profile' })
  async updateWelperProfile(
    @Param('welperId') welperId: string,
    @Body() updateDto: UpdateWelperProfileDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.welperProfileService.update(welperId, updateDto, user.userId);
  }

  @Put(':welperId/onboarding-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding marked as complete',
    type: WelperProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Welper profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your profile' })
  async markOnboardingComplete(
    @Param('welperId') welperId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.welperProfileService.markOnboardingComplete(
      welperId,
      user.userId,
    );
  }
}

