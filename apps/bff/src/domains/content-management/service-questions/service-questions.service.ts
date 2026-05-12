import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceQuestion } from '../entities/service-question.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import { Question } from '../entities/question.entity';
import { AssignQuestionDto } from './dto/assign-question.dto';

@Injectable()
export class ServiceQuestionsService {
  constructor(
    @InjectRepository(ServiceQuestion)
    private serviceQuestionRepository: Repository<ServiceQuestion>,
    @InjectRepository(ServiceCategory)
    private categoryRepository: Repository<ServiceCategory>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async findByServiceCategory(
    serviceCategoryId: string,
  ): Promise<ServiceQuestion[]> {
    return this.serviceQuestionRepository.find({
      where: { serviceCategoryId },
      relations: ['question'],
      order: { displayOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ServiceQuestion> {
    const serviceQuestion = await this.serviceQuestionRepository.findOne({
      where: { id },
      relations: ['question', 'serviceCategory'],
    });

    if (!serviceQuestion) {
      throw new NotFoundException(
        `Service question with ID ${id} not found`,
      );
    }

    return serviceQuestion;
  }

  async assign(assignDto: AssignQuestionDto): Promise<ServiceQuestion> {
    // Validate service category exists
    const category = await this.categoryRepository.findOne({
      where: { id: assignDto.serviceCategoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Service category with ID ${assignDto.serviceCategoryId} not found`,
      );
    }

    // Validate question exists
    const question = await this.questionRepository.findOne({
      where: { id: assignDto.questionId },
    });
    if (!question) {
      throw new BadRequestException(
        `Question with ID ${assignDto.questionId} not found`,
      );
    }

    // Check if already assigned
    const existing = await this.serviceQuestionRepository.findOne({
      where: {
        serviceCategoryId: assignDto.serviceCategoryId,
        questionId: assignDto.questionId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Question is already assigned to this service category',
      );
    }

    const serviceQuestion = this.serviceQuestionRepository.create({
      serviceCategoryId: assignDto.serviceCategoryId,
      questionId: assignDto.questionId,
      displayOrder: assignDto.displayOrder ?? 0,
      isRequired: assignDto.isRequired ?? true,
      conditionalLogic: assignDto.conditionalLogic ?? null,
    });

    return this.serviceQuestionRepository.save(serviceQuestion);
  }

  async update(
    id: string,
    updateDto: Partial<AssignQuestionDto>,
  ): Promise<ServiceQuestion> {
    const serviceQuestion = await this.findOne(id);

    if (updateDto.displayOrder !== undefined) {
      serviceQuestion.displayOrder = updateDto.displayOrder;
    }
    if (updateDto.isRequired !== undefined) {
      serviceQuestion.isRequired = updateDto.isRequired;
    }
    if (updateDto.conditionalLogic !== undefined) {
      serviceQuestion.conditionalLogic = updateDto.conditionalLogic ?? null;
    }

    return this.serviceQuestionRepository.save(serviceQuestion);
  }

  async remove(id: string): Promise<void> {
    const serviceQuestion = await this.findOne(id);
    await this.serviceQuestionRepository.remove(serviceQuestion);
  }

  async removeByServiceCategory(serviceCategoryId: string): Promise<void> {
    await this.serviceQuestionRepository.delete({ serviceCategoryId });
  }
}
