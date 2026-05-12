import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserAccount } from '../entities';
import { EventsModule } from '../events/events.module';
import { EmailVerifiedGuardModule } from '../../../common/guards/email-verified.guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccount]),
    forwardRef(() => EventsModule),
    EmailVerifiedGuardModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

