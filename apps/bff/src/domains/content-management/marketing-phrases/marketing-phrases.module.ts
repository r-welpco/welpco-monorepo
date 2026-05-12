import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingPhrase } from '../entities/marketing-phrase.entity';
import { MarketingPhrasesService } from './marketing-phrases.service';
import { MarketingPhrasesController } from './marketing-phrases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MarketingPhrase])],
  controllers: [MarketingPhrasesController],
  providers: [MarketingPhrasesService],
  exports: [MarketingPhrasesService],
})
export class MarketingPhrasesModule {}
