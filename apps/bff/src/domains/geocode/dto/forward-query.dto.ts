import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForwardGeocodeQueryDto {
  @ApiProperty({ description: 'Postal or ZIP code' })
  @IsString()
  postalCode!: string;

  @ApiPropertyOptional({ description: 'Country code for disambiguation (e.g. CA, US)' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}
