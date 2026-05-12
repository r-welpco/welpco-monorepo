import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventPublisherService } from './event-publisher.service';
import { VerificationStatus } from '../entities/verification-status.entity';
import { Referral } from '../entities/referral.entity';
import { UserAccount } from '../entities/user-account.entity';
import { ReferralModule } from '../referral/referral.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationStatus, Referral, UserAccount]),
    forwardRef(() => ReferralModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}
