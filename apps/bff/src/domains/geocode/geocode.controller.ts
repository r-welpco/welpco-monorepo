import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators/public.decorator';
import { GEOCODE_SERVICE } from './geocode.interface';
import type { IGeocodeService } from './geocode.interface';
import { ReverseGeocodeQueryDto } from './dto/reverse-query.dto';
import { ForwardGeocodeQueryDto } from './dto/forward-query.dto';
import { GeocodeResultDto } from './dto/geocode-result.dto';

@ApiTags('Geocode')
@Controller('geocode')
export class GeocodeController {
  constructor(
    @Inject(GEOCODE_SERVICE) private readonly geocodeService: IGeocodeService,
  ) {}

  @Get('reverse')
  @Public()
  @ApiOperation({ summary: 'Reverse geocode coordinates to address (country, province, postal code)' })
  @ApiResponse({ status: 200, description: 'Address components', type: GeocodeResultDto })
  @ApiResponse({ status: 400, description: 'Invalid coordinates or geocoding failed' })
  async reverse(@Query() query: ReverseGeocodeQueryDto): Promise<GeocodeResultDto> {
    return this.geocodeService.reverse(query.latitude, query.longitude);
  }

  @Get('forward')
  @Public()
  @ApiOperation({ summary: 'Forward geocode postal code to coordinates (and address components)' })
  @ApiResponse({ status: 200, description: 'Coordinates and address', type: GeocodeResultDto })
  @ApiResponse({ status: 400, description: 'Invalid postal code or geocoding failed' })
  async forward(@Query() query: ForwardGeocodeQueryDto): Promise<GeocodeResultDto> {
    return this.geocodeService.forward(query.postalCode, query.countryCode);
  }
}
