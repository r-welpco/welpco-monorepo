import {
  Controller,
  Get,
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
import { CustomerProfileService } from './customer-profile.service';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { CustomerProfileResponseDto } from './dto/customer-profile-response.dto';
import { CurrentUser, JwtAuthGuard } from '../../../common/auth';

@ApiTags('Customer Profile')
@Controller('profiles/customer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerProfileController {
  constructor(
    private readonly customerProfileService: CustomerProfileService,
  ) {}

  @Get(':customerId')
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile retrieved successfully',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  async getCustomerProfile(@Param('customerId') customerId: string) {
    return this.customerProfileService.findByCustomerId(customerId);
  }

  @Put(':customerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile updated successfully',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your profile' })
  async updateCustomerProfile(
    @Param('customerId') customerId: string,
    @Body() updateDto: UpdateCustomerProfileDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.customerProfileService.update(
      customerId,
      updateDto,
      user.userId,
    );
  }

  @Put(':customerId/onboarding-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding marked as complete',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your profile' })
  async markOnboardingComplete(
    @Param('customerId') customerId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.customerProfileService.markOnboardingComplete(
      customerId,
      user.userId,
    );
  }
}

