import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VercelWebAnalyticsClient } from './vercel-web-analytics.client';

@Module({
  imports: [ConfigModule],
  providers: [VercelWebAnalyticsClient],
  exports: [VercelWebAnalyticsClient],
})
export class VercelModule {}
