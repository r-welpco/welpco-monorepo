import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendEmailsClient } from './resend-emails.client';

@Module({
  imports: [ConfigModule],
  providers: [ResendEmailsClient],
  exports: [ResendEmailsClient],
})
export class ResendModule {}
