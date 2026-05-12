import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../entities/question.entity';
import { ServiceQuestion } from '../entities/service-question.entity';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Question, ServiceQuestion])],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
