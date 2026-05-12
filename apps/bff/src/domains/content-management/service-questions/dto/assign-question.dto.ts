import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsInt,
  IsBoolean,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

export class AssignQuestionDto {
  @ApiProperty({ description: 'Service category ID' })
  @IsUUID()
  serviceCategoryId!: string;

  @ApiProperty({ description: 'Question ID' })
  @IsUUID()
  questionId!: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is question required', default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Conditional logic',
    example: { showIf: { questionId: 'xxx', value: 'recurring' } },
  })
  @IsOptional()
  @IsObject()
  conditionalLogic?: {
    showIf?: {
      questionId: string;
      value: string | number | boolean;
    };
  } | null;
}
