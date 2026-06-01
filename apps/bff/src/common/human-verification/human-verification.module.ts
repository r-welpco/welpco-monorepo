import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HumanVerificationService } from './human-verification.service';

@Module({
  imports: [ConfigModule],
  providers: [HumanVerificationService],
  exports: [HumanVerificationService],
})
export class HumanVerificationModule {}
