import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, EntityType } from '../../entities/question.entity';

export class QuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  id!: string;

  @ApiProperty({ description: 'Question type', enum: QuestionType })
  type!: QuestionType;

  @ApiProperty({ description: 'Question label' })
  label!: string;

  @ApiPropertyOptional({ description: 'Placeholder text' })
  placeholder?: string | null;

  @ApiPropertyOptional({ description: 'Help text' })
  helpText?: string | null;

  @ApiPropertyOptional({
    description: 'Validation rules',
    example: { required: true, min: 0 },
  })
  validationRules?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;

  @ApiPropertyOptional({
    description: 'Options for choice type questions',
    example: [{ value: 'one-time', label: 'One time' }],
  })
  options?: Array<{ value: string; label: string }> | null;

  @ApiPropertyOptional({ description: 'Entity type for entity_reference questions', enum: EntityType })
  entityType?: EntityType | null;

  @ApiProperty({ description: 'Display order' })
  displayOrder!: number;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt!: Date;
}
