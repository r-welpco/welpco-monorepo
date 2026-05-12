import { ApiPropertyOptional } from '@nestjs/swagger';

/** Shared response shape for reverse and forward geocode. */
export class GeocodeResultDto {
  @ApiPropertyOptional({ description: 'Latitude (always for forward; optional for reverse)' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (always for forward; optional for reverse)' })
  longitude?: number;

  @ApiPropertyOptional({ description: 'Two-letter country code (e.g. CA, US)' })
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  countryName?: string;

  @ApiPropertyOptional({ description: 'Province/state code (e.g. QC, ON)' })
  provinceCode?: string;

  @ApiPropertyOptional({ description: 'Province/state name' })
  provinceName?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  postalCode?: string;
}
