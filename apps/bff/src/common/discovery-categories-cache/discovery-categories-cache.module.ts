import { Global, Module } from '@nestjs/common';
import { DiscoveryCategoriesCacheService } from './discovery-categories-cache.service';

@Global()
@Module({
  providers: [DiscoveryCategoriesCacheService],
  exports: [DiscoveryCategoriesCacheService],
})
export class DiscoveryCategoriesCacheModule {}
