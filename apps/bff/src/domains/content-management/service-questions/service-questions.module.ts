import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceQuestion } from '../entities/service-question.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import { Question } from '../entities/question.entity';
import { ServiceQuestionsService } from './service-questions.service';
import { ServiceQuestionsController } from './service-questions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceQuestion, ServiceCategory, Question]),
  ],
  controllers: [ServiceQuestionsController],
  providers: [ServiceQuestionsService],
  exports: [ServiceQuestionsService],
})
export class ServiceQuestionsModule {}
