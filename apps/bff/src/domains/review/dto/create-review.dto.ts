import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsString, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

const MAX_COMMENT_LENGTH = 2000;

export class CreateReviewDto {
  @ApiProperty({ description: 'Star rating 1-5', minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'Optional text review', maxLength: MAX_COMMENT_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_COMMENT_LENGTH)
  comment?: string;
}
