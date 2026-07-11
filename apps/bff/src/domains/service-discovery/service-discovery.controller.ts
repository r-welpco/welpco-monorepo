import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ServiceDiscoveryService } from './service-discovery.service';
import { ProfileViewsService } from '../profile-management/sharing/profile-views.service';
import { RecordProfileViewDto } from '../profile-management/sharing/dto';
import { SearchServicesQueryDto } from './dto/search-services-query.dto';
import { SearchResultItemDto, SearchServicesResponseDto } from './dto/search-result-item.dto';
import { PublicWelperProfileDto } from './dto/public-welper-profile.dto';

@ApiTags('Service Discovery')
@Controller('search')
export class ServiceDiscoveryController {
  constructor(
    private readonly serviceDiscoveryService: ServiceDiscoveryService,
    private readonly profileViewsService: ProfileViewsService,
  ) {}

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

  /**
   * SHARE-002: vanity-handle resolve for `welpco.com/w/{handle}`. Declared
   * BEFORE `welpers/:welperId` so "by-handle" isn't consumed as a welper id.
   * Public — this controller carries no auth guard by design.
   */
  @Get('welpers/by-handle/:handle')
  @ApiOperation({ summary: 'Get public Welper profile by vanity handle' })
  @ApiParam({ name: 'handle', description: 'Vanity handle (lowercase)' })
  @ApiResponse({
    status: 200,
    description: 'Public Welper profile with service offerings (same payload as by-id)',
    type: PublicWelperProfileDto,
  })
  @ApiResponse({ status: 404, description: 'Handle unknown, or profile not public' })
  async getPublicWelperProfileByHandle(@Param('handle') handle: string) {
    return this.serviceDiscoveryService.getPublicWelperProfileByHandle(handle);
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

  /**
   * SHARE-005: fire-and-forget public view ping. ALWAYS answers 204 — even
   * for unknown welper ids — so it can't be used to enumerate welpers. No
   * IP/UA is stored; `src` is whitelisted server-side. Note: no rate guard
   * yet (the BFF has no throttler infrastructure) — flagged as future work.
   */
  @Post('welpers/:welperId/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a public profile view (fire-and-forget, no PII)' })
  @ApiParam({ name: 'welperId', description: 'Welper user ID' })
  @ApiResponse({ status: 204, description: 'Always — including for unknown welpers' })
  async recordProfileView(
    @Param('welperId') welperId: string,
    @Body() dto: RecordProfileViewDto,
  ): Promise<void> {
    await this.profileViewsService.recordView(welperId, dto?.src);
  }
}
