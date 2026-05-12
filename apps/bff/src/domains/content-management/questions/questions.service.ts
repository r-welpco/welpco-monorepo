import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionType } from '../entities/question.entity';
import { ServiceQuestion } from '../entities/service-question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(ServiceQuestion)
    private serviceQuestionRepository: Repository<ServiceQuestion>,
  ) {}

  async findAll(): Promise<Question[]> {
    return this.questionRepository.find({
      order: { displayOrder: 'ASC', label: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async findByType(type: string): Promise<Question[]> {
    const validTypes = Object.values(QuestionType);
    if (!validTypes.includes(type as QuestionType)) {
      throw new BadRequestException(
        `Invalid question type "${type}". Valid types: ${validTypes.join(', ')}`,
      );
    }
    return this.questionRepository.find({
      where: { type: type as QuestionType },
      order: { displayOrder: 'ASC', label: 'ASC' },
    });
  }

  async create(createDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create({
      type: createDto.type,
      label: createDto.label,
      placeholder: createDto.placeholder ?? null,
      helpText: createDto.helpText ?? null,
      validationRules: createDto.validationRules ?? null,
      options: createDto.options ?? null,
      entityType: createDto.entityType ?? null,
      displayOrder: createDto.displayOrder ?? 0,
    });

    return this.questionRepository.save(question);
  }

  async update(id: string, updateDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(id);

    Object.assign(question, updateDto);
    return this.questionRepository.save(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.findOne(id);
    // Remove all service-category assignments first to avoid orphaned rows
    await this.serviceQuestionRepository.delete({ questionId: id });
    await this.questionRepository.remove(question);
  }
}
