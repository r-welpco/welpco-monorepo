import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaticContent } from '../entities/static-content.entity';
import { StaticContentService } from './static-content.service';
import { StaticContentController } from './static-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StaticContent])],
  controllers: [StaticContentController],
  providers: [StaticContentService],
  exports: [StaticContentService],
})
export class StaticContentModule {}
