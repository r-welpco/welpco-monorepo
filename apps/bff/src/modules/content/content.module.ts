import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentManagementDomainModule } from '../../domains/content-management/content-management.module';

@Module({
  imports: [ContentManagementDomainModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
