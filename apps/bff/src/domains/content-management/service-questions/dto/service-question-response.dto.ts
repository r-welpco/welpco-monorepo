import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionResponseDto } from '../../questions/dto/question-response.dto';

export class ServiceQuestionResponseDto {
  @ApiProperty({ description: 'Service question ID' })
  id!: string;

  @ApiProperty({ description: 'Service category ID' })
  serviceCategoryId!: string;

  @ApiProperty({ description: 'Question ID' })
  questionId!: string;

  @ApiProperty({ description: 'Display order' })
  displayOrder!: number;

  @ApiProperty({ description: 'Is question required' })
  isRequired!: boolean;

  @ApiPropertyOptional({
    description: 'Conditional logic',
    example: { showIf: { questionId: 'xxx', value: 'recurring' } },
  })
  conditionalLogic?: {
    showIf?: {
      questionId: string;
      value: string | number | boolean;
    };
  } | null;

  @ApiProperty({ description: 'Question details', type: QuestionResponseDto })
  question!: QuestionResponseDto;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt!: Date;
}
