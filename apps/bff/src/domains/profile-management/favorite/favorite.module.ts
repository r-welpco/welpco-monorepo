import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteWelper } from '../entities/favorite-welper.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoriteWelper, CustomerProfile, WelperProfile]),
    EventsModule,
  ],
  controllers: [FavoriteController],
  providers: [FavoriteService],
  exports: [FavoriteService],
})
export class FavoriteModule {}

