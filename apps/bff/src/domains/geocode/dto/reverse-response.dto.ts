import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReverseGeocodeResponseDto {
  @ApiPropertyOptional({ description: 'Two-letter country code (e.g. CA, US)' })
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  countryName?: string;

  @ApiPropertyOptional({ description: 'Province/state code or name' })
  provinceCode?: string;

  @ApiPropertyOptional({ description: 'Province/state name' })
  provinceName?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  postalCode?: string;
}
