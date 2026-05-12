import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsObject,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, EntityType } from '../../entities/question.entity';

class ValidationRulesDto {
  @ApiPropertyOptional({ description: 'Is field required' })
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Minimum value' })
  @IsOptional()
  min?: number;

  @ApiPropertyOptional({ description: 'Maximum value' })
  @IsOptional()
  max?: number;

  @ApiPropertyOptional({ description: 'Validation pattern (regex)' })
  @IsOptional()
  @IsString()
  pattern?: string;
}

class QuestionOptionDto {
  @ApiProperty({ description: 'Option value' })
  @IsString()
  value!: string;

  @ApiProperty({ description: 'Option label' })
  @IsString()
  label!: string;
}

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Question type',
    enum: QuestionType,
    example: QuestionType.TEXT,
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ description: 'Question label', example: 'Date needed' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label!: string;

  @ApiPropertyOptional({ description: 'Placeholder text' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeholder?: string | null;

  @ApiPropertyOptional({ description: 'Help text' })
  @IsOptional()
  @IsString()
  helpText?: string | null;

  @ApiPropertyOptional({ description: 'Validation rules', type: ValidationRulesDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ValidationRulesDto)
  validationRules?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;

  @ApiPropertyOptional({
    description: 'Options for choice type questions',
    type: [QuestionOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: Array<{ value: string; label: string }> | null;

  @ApiPropertyOptional({
    description: 'Entity type for entity_reference questions',
    enum: EntityType,
  })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType | null;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
