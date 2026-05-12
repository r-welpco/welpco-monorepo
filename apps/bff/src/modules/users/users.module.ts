import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserManagementDomainModule } from '../../domains/user-management/user-management.module';

@Module({
  imports: [
    UserManagementDomainModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
