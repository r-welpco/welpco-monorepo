import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FAQItem } from '../entities/faq-item.entity';
import { FaqItemsService } from './faq-items.service';
import { FaqItemsController } from './faq-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FAQItem])],
  controllers: [FaqItemsController],
  providers: [FaqItemsService],
  exports: [FaqItemsService],
})
export class FaqItemsModule {}
