import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CoordinatesDto {
  @ApiProperty({
    description: 'Latitude',
    example: 37.7749,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
    example: -122.4194,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class AddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Main St',
  })
  @IsString()
  streetAddress: string;

  @ApiProperty({
    description: 'City',
    example: 'San Francisco',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'CA',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'ZIP or postal code',
    example: '94102',
  })
  @IsString()
  zipCode: string;

  @ApiProperty({
    description: 'Country (optional)',
    example: 'USA',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Coordinates (optional)',
    example: { latitude: 37.7749, longitude: -122.4194 },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}
