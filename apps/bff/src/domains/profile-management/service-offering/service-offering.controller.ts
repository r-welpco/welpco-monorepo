import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ServiceOfferingService } from './service-offering.service';
import { CreateServiceOfferingDto } from './dto/create-service-offering.dto';
import { UpdateServiceOfferingDto } from './dto/update-service-offering.dto';
import { ServiceOfferingResponseDto } from './dto/service-offering-response.dto';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../../common/auth';

@ApiTags('Service Offerings')
@Controller('profiles/welper/:welperId/services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceOfferingController {
  constructor(
    private readonly serviceOfferingService: ServiceOfferingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Welper service offerings' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'active', type: Boolean, required: false, description: 'Filter by active status' })
  @ApiResponse({
    status: 200,
    description: 'Service offerings retrieved successfully',
    type: [ServiceOfferingResponseDto],
  })
  async getServiceOfferings(
    @Param('welperId') welperId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    const activeFilter = active !== undefined ? active === 'true' : undefined;
    return this.serviceOfferingService.findByWelperId(welperId, pageNum, limitNum, activeFilter);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add service offering' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiResponse({
    status: 201,
    description: 'Service offering created successfully',
    type: ServiceOfferingResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addServiceOffering(
    @Param('welperId') welperId: string,
    @Body() createDto: CreateServiceOfferingDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.serviceOfferingService.create(welperId, createDto, user.userId);
  }

  @Put(':serviceId')
  @UseGuards(RolesGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update service offering' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiParam({ name: 'serviceId', description: 'Service offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Service offering updated successfully',
    type: ServiceOfferingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service offering not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateServiceOffering(
    @Param('welperId') welperId: string,
    @Param('serviceId') serviceId: string,
    @Body() updateDto: UpdateServiceOfferingDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.serviceOfferingService.update(
      welperId,
      serviceId,
      updateDto,
      user.userId,
    );
  }

  @Delete(':serviceId')
  @UseGuards(RolesGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete service offering' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiParam({ name: 'serviceId', description: 'Service offering ID' })
  @ApiResponse({
    status: 204,
    description: 'Service offering deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Service offering not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteServiceOffering(
    @Param('welperId') welperId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.serviceOfferingService.delete(welperId, serviceId, user.userId);
  }
}
