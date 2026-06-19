import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOfferingDto } from './create-service-offering.dto';
import { IsArray, IsOptional, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceOfferingDto extends PartialType(
  CreateServiceOfferingDto,
) {
  @ApiPropertyOptional({
    description: 'Array of subcategory IDs (from Content Management)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'subcategoryIds must include at least one subcategory' })
  @IsUUID(4, { each: true })
  declare subcategoryIds?: string[];
}

