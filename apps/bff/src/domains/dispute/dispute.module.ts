import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../common/auth';
import { Dispute } from './entities/dispute.entity';
import { Resolution } from './entities/resolution.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { BookingRequest } from '../booking/entities/booking-request.entity';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { PaymentModule } from '../payment/payment.module';
import { AdminAuditModule } from '../user-management/admin/admin-audit.module';
import { NotificationModule } from '../notification/notification.module';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dispute,
      Resolution,
      SupportTicket,
      BookingRequest,
      UserAccount,
      CustomerProfile,
      WelperProfile,
    ]),
    AuthModule,
    PaymentModule,
    AdminAuditModule,
    NotificationModule,
  ],
  controllers: [DisputeController, SupportTicketController],
  providers: [DisputeService, SupportTicketService],
  exports: [DisputeService, SupportTicketService],
})
export class DisputeModule {}
