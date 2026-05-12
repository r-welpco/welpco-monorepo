import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../common/auth';
import { CategoriesModule } from './categories/categories.module';
import { HolidayModule } from './holiday/holiday.module';
import { QuestionsModule } from './questions/questions.module';
import { ServiceQuestionsModule } from './service-questions/service-questions.module';
import { StaticContentModule } from './static-content/static-content.module';
import { FaqItemsModule } from './faq-items/faq-items.module';
import { MarketingPhrasesModule } from './marketing-phrases/marketing-phrases.module';
import { EventsModule } from './events/events.module';

/**
 * Content management domain module. Does not include DatabaseModule or HealthModule - the BFF provides those at app level.
 */
@Module({
  imports: [
    ConfigModule,
    AuthModule,
    EventsModule,
    CategoriesModule,
    HolidayModule,
    QuestionsModule,
    ServiceQuestionsModule,
    StaticContentModule,
    FaqItemsModule,
    MarketingPhrasesModule,
  ],
  exports: [
    CategoriesModule,
    HolidayModule,
    QuestionsModule,
    ServiceQuestionsModule,
    StaticContentModule,
    FaqItemsModule,
    MarketingPhrasesModule,
  ],
})
export class ContentManagementDomainModule {}
