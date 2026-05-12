import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { CurrentUser, JwtAuthGuard } from '../../../common/auth';

@ApiTags('Availability')
@Controller('profiles/welper/:welperId/availability')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Get availability calendar' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'dayOfWeek', type: String, required: false, description: 'Filter by day of week' })
  @ApiQuery({ name: 'available', type: Boolean, required: false, description: 'Filter by available status' })
  @ApiResponse({
    status: 200,
    description: 'Availability calendar retrieved successfully',
    type: [AvailabilityResponseDto],
  })
  async getAvailability(
    @Param('welperId') welperId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('available') available?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    const availableFilter = available !== undefined ? available === 'true' : undefined;
    return this.availabilityService.findByWelperId(welperId, pageNum, limitNum, dayOfWeek, availableFilter);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update availability calendar' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiResponse({
    status: 200,
    description: 'Availability calendar updated successfully',
    type: [AvailabilityResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Welper profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateAvailability(
    @Param('welperId') welperId: string,
    @Body() updateDto: UpdateAvailabilityDto[],
    @CurrentUser() user: { userId: string },
  ) {
    return this.availabilityService.update(welperId, updateDto, user.userId);
  }
}

