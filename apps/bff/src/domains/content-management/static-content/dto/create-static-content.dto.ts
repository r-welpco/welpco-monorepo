import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ContentType } from '../../entities/static-content.entity';

export class CreateStaticContentDto {
  @ApiProperty({
    description: 'Content type',
    enum: ContentType,
    example: ContentType.ABOUT_US,
  })
  @IsEnum(ContentType)
  contentType!: ContentType;

  @ApiProperty({ description: 'Content title', example: 'About Us' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Content body (HTML or markdown)' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Content version', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiPropertyOptional({ description: 'Is content published', default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Published date' })
  @IsOptional()
  publishedDate?: Date | null;
}
