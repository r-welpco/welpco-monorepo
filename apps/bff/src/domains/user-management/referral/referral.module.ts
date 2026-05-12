import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { ReferralCode, Referral, UserAccount } from '../entities';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralCode, Referral, UserAccount]),
    forwardRef(() => EventsModule),
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}

