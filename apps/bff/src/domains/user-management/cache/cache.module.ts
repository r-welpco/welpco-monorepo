import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { MemoryCacheService } from './memory-cache.service';

@Global()
@Module({
  providers: [CacheService, MemoryCacheService],
  exports: [CacheService],
})
export class CacheModule {}

