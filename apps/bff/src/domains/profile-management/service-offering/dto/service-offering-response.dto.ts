import { ApiProperty } from '@nestjs/swagger';

export class ServiceOfferingResponseDto {
  @ApiProperty({ description: 'Service offering ID' })
  id: string;

  @ApiProperty({ description: 'Welper ID' })
  welperId: string;

  @ApiProperty({ description: 'Service category ID' })
  serviceCategoryId: string;

  @ApiProperty({ description: 'Service description' })
  serviceDescription: string;

  @ApiProperty({ description: 'Hourly rate (required)' })
  hourlyRate: number;

  @ApiProperty({ description: 'Experience in years for this specific service' })
  experienceYears: number;

  @ApiProperty({ description: 'Service area (GeoJSON)', nullable: true })
  serviceArea: any | null;

  @ApiProperty({ description: 'Array of subcategory IDs', type: [String], required: false })
  subcategoryIds?: string[];

  @ApiProperty({ description: 'Active status' })
  active: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

