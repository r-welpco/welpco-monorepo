import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../common/auth';
import { ChatThread } from './entities/chat-thread.entity';
import { Message } from './entities/message.entity';
import { BookingRequest } from '../booking/entities/booking-request.entity';
import { BookingModule } from '../booking/booking.module';
import { UsersModule } from '../user-management/users/users.module';
import { WelperProfileModule } from '../profile-management/welper-profile/welper-profile.module';
import { CustomerProfileModule } from '../profile-management/customer-profile/customer-profile.module';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { ChatInboxController } from './chat-inbox.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatThread, Message, BookingRequest]),
    AuthModule,
    BookingModule,
    UsersModule,
    WelperProfileModule,
    CustomerProfileModule,
    NotificationModule,
  ],
  controllers: [CommunicationController, ChatInboxController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
