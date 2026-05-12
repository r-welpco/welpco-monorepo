import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';
import { GuardianAccount, UserAccount } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([GuardianAccount, UserAccount])],
  controllers: [GuardianController],
  providers: [GuardianService],
  exports: [GuardianService],
})
export class GuardianModule {}

