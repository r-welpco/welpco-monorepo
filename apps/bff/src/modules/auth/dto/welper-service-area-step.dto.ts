import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ServiceAreaCenterAddressDto {
  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  streetAddress?: string;

  @ApiProperty({ example: 'Toronto' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 'ON' })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  stateProvince!: string;

  @ApiProperty({ example: 'M5V 2T6', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipPostalCode?: string;

  @ApiProperty({ example: 'CA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  country?: string;
}

export class SignupRadiusServiceAreaDto {
  @ApiProperty({ enum: ['radius'] })
  @IsIn(['radius'])
  type!: 'radius';

  @ApiProperty({ type: ServiceAreaCenterAddressDto })
  @ValidateNested()
  @Type(() => ServiceAreaCenterAddressDto)
  centerAddress!: ServiceAreaCenterAddressDto;

  @ApiProperty({ example: 25, description: 'Service radius in kilometres (1–100)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm!: number;
}

/**
 * Welper-only step: center address + service radius (stored on profile.service_area).
 */
export class WelperServiceAreaStepDto {
  @ApiProperty({ type: SignupRadiusServiceAreaDto })
  @ValidateNested()
  @Type(() => SignupRadiusServiceAreaDto)
  serviceArea!: SignupRadiusServiceAreaDto;
}
