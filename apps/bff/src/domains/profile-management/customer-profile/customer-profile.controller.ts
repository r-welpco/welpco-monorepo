import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
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
import { CustomerPublicSummaryDto } from './dto/customer-public-summary.dto';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../../../common/auth';
import { AccountType } from '../../user-management/entities/user-account.entity';

@ApiTags('Customer Profile')
@Controller('profiles/customer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerProfileController {
  constructor(
    private readonly customerProfileService: CustomerProfileService,
  ) {}

  @Get(':customerId/summary')
  @UseGuards(RolesGuard)
  @Roles(AccountType.WELPER)
  @ApiOperation({
    summary: 'Get public customer summary (welpers only)',
    description:
      'Privacy-safe snapshot: display name, photo, welper-review rating, booking/job counts, member since.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer user ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer summary retrieved',
    type: CustomerPublicSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 403, description: 'Welper role required' })
  async getCustomerPublicSummary(
    @Param('customerId') customerId: string,
  ): Promise<CustomerPublicSummaryDto> {
    return this.customerProfileService.getPublicSummary(customerId);
  }

  @Get(':customerId')
  @UseGuards(RolesGuard)
  @Roles(AccountType.CUSTOMER, AccountType.ADMIN)
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile retrieved successfully',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  async getCustomerProfile(
    @Param('customerId') customerId: string,
    @CurrentUser() user: { userId: string; effectiveRole: string },
  ) {
    if (
      user.effectiveRole !== 'admin' &&
      (user.effectiveRole !== 'customer' || user.userId !== customerId)
    ) {
      throw new ForbiddenException('You can only view your own full profile');
    }
    return this.customerProfileService.findByCustomerId(customerId);
  }

  @Put(':customerId')
  @UseGuards(RolesGuard)
  @Roles(AccountType.CUSTOMER)
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
  @UseGuards(RolesGuard)
  @Roles(AccountType.CUSTOMER)
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
