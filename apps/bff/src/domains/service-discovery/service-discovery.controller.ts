import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ServiceDiscoveryService } from './service-discovery.service';
import { SearchServicesQueryDto } from './dto/search-services-query.dto';
import { SearchResultItemDto, SearchServicesResponseDto } from './dto/search-result-item.dto';
import { PublicWelperProfileDto } from './dto/public-welper-profile.dto';

@ApiTags('Service Discovery')
@Controller('search')
export class ServiceDiscoveryController {
  constructor(private readonly serviceDiscoveryService: ServiceDiscoveryService) {}

  @Get('services')
  @ApiOperation({ summary: 'Search for services and Welpers' })
  @ApiResponse({
    status: 200,
    description: 'Paginated search results',
    type: SearchServicesResponseDto,
  })
  async searchServices(@Query() query: SearchServicesQueryDto) {
    return this.serviceDiscoveryService.searchServices(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories for browsing' })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include welper/service counts per category (Phase 2)',
  })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories(@Query('includeCounts') includeCounts?: string) {
    const include = includeCounts === 'true';
    return this.serviceDiscoveryService.getCategories(include);
  }

  @Get('welpers/:welperId')
  @ApiOperation({ summary: 'Get public Welper profile with offerings' })
  @ApiParam({ name: 'welperId', description: 'Welper user ID' })
  @ApiResponse({
    status: 200,
    description: 'Public Welper profile with service offerings',
    type: PublicWelperProfileDto,
  })
  @ApiResponse({ status: 404, description: 'Welper profile not found or not public' })
  async getPublicWelperProfile(@Param('welperId') welperId: string) {
    return this.serviceDiscoveryService.getPublicWelperProfile(welperId);
  }
}
