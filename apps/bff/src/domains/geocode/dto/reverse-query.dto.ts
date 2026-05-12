import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReverseGeocodeQueryDto {
  @ApiProperty({ description: 'Latitude (-90 to 90)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude (-180 to 180)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
