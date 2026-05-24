import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  UseGuards,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../../common/auth';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateServicePreferencesDto } from './dto/update-service-preferences.dto';
import { CreateServiceOfferingDto } from '../../domains/profile-management/service-offering/dto/create-service-offering.dto';
import { UpdateServiceOfferingDto } from '../../domains/profile-management/service-offering/dto/update-service-offering.dto';
import { CreateAvailabilityExceptionDto } from '../../domains/profile-management/availability/dto/create-availability-exception.dto';

interface AuthUser {
  userId: string;
  email: string;
  accountType: string;
}

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@CurrentUser() user: AuthUser) {
    return this.profilesService.getMyProfile(user.userId, user.accountType);
  }

  @Get('me/setup-checklist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('welper', 'customer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Post-signup setup checklist (done vs todo)' })
  @ApiResponse({ status: 200, description: 'Setup checklist retrieved' })
  @ApiResponse({ status: 403, description: 'Customer or welper accounts only' })
  async getSetupChecklist(@CurrentUser() user: AuthUser) {
    return this.profilesService.getSetupChecklist(user.userId, user.accountType);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateMyProfile(@CurrentUser() user: AuthUser, @Body() data: UpdateMyProfileDto) {
    return this.profilesService.updateMyProfile(user.userId, user.accountType, data);
  }

  @Put('me/onboarding-complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiResponse({ status: 200, description: 'Onboarding marked as complete' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeOnboarding(@CurrentUser() user: AuthUser) {
    return this.profilesService.completeOnboarding(user.userId, user.accountType);
  }

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer service preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Customers only' })
  async getMyServicePreferences(@CurrentUser() user: AuthUser) {
    return this.profilesService.getMyServicePreferences(user.userId, user.accountType);
  }

  @Put('me/preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer service preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Customers only' })
  async updateMyServicePreferences(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateServicePreferencesDto,
  ) {
    return this.profilesService.updateMyServicePreferences(user.userId, user.accountType, body);
  }

  @Get('me/services')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get service offerings for current welper' })
  @ApiResponse({ status: 200, description: 'Service offerings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getServiceOfferings(@CurrentUser() user: AuthUser) {
    return this.profilesService.getServiceOfferings(user.userId);
  }

  @Post('me/services')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create service offering for current welper' })
  @ApiResponse({ status: 201, description: 'Service offering created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createServiceOffering(@CurrentUser() user: AuthUser, @Body() data: CreateServiceOfferingDto) {
    return this.profilesService.createServiceOffering(user.userId, data);
  }

  @Put('me/services/:serviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update service offering for current welper' })
  @ApiParam({ name: 'serviceId', description: 'Service offering ID' })
  @ApiResponse({ status: 200, description: 'Service offering updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service offering not found' })
  async updateServiceOffering(
    @CurrentUser() user: AuthUser,
    @Param('serviceId') serviceId: string,
    @Body() data: UpdateServiceOfferingDto,
  ) {
    return this.profilesService.updateServiceOffering(user.userId, serviceId, data);
  }

  @Delete('me/services/:serviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete service offering for current welper' })
  @ApiParam({ name: 'serviceId', description: 'Service offering ID' })
  @ApiResponse({ status: 200, description: 'Service offering deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service offering not found' })
  async deleteServiceOffering(@CurrentUser() user: AuthUser, @Param('serviceId') serviceId: string) {
    return this.profilesService.deleteServiceOffering(user.userId, serviceId);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get favorite welpers for current customer' })
  @ApiResponse({ status: 200, description: 'Favorite welpers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavoriteWelpers(@CurrentUser() user: AuthUser) {
    return this.profilesService.getFavoriteWelpers(user.userId);
  }

  @Post('me/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add favorite welper' })
  @ApiResponse({ status: 201, description: 'Favorite welper added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addFavoriteWelper(@CurrentUser() user: AuthUser, @Body() body: { welperId: string }) {
    return this.profilesService.addFavoriteWelper(user.userId, body.welperId);
  }

  @Delete('me/favorites/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove favorite welper by favorite row ID or welper ID' })
  @ApiParam({ name: 'id', description: 'Favorite row ID (UUID) or welper ID' })
  @ApiResponse({ status: 200, description: 'Favorite welper removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async removeFavorite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.profilesService.removeFavoriteByIdOrWelperId(user.userId, id);
  }

  @Get('me/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get availability schedule for current welper' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 100)' })
  @ApiResponse({ status: 200, description: 'Availability schedule retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailability(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const options: { page?: number; limit?: number } = {};
    if (page) options.page = Math.max(1, parseInt(page, 10));
    if (limit) options.limit = Math.min(100, Math.max(1, parseInt(limit, 10)));
    return this.profilesService.getAvailability(user.userId, options);
  }

  @Put('me/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update availability schedule for current welper' })
  @ApiResponse({ status: 200, description: 'Availability schedule updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Welper profile not found' })
  async updateAvailability(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.profilesService.updateAvailability(user.userId, body);
  }

  @Get('me/availability/exceptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get availability exceptions for current welper' })
  @ApiQuery({ name: 'calendarId', required: false, type: String, description: 'Filter by calendar ID' })
  @ApiResponse({ status: 200, description: 'Availability exceptions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailabilityExceptions(@CurrentUser() user: AuthUser, @Query('calendarId') calendarId?: string) {
    return this.profilesService.getAvailabilityExceptions(user.userId, calendarId);
  }

  @Post('me/availability/exceptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add availability exception for current welper' })
  @ApiResponse({ status: 201, description: 'Availability exception created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async addAvailabilityException(@CurrentUser() user: AuthUser, @Body() body: CreateAvailabilityExceptionDto) {
    return this.profilesService.addAvailabilityException(user.userId, body);
  }

  @Delete('me/availability/exceptions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove availability exception' })
  @ApiParam({ name: 'id', description: 'Exception ID' })
  @ApiResponse({ status: 200, description: 'Availability exception removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exception not found' })
  async removeAvailabilityException(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.profilesService.removeAvailabilityException(user.userId, id);
  }
}
