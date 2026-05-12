import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Holiday } from '../entities/holiday.entity';
import { HolidayService } from './holiday.service';

@Module({
  imports: [TypeOrmModule.forFeature([Holiday])],
  providers: [HolidayService],
  exports: [HolidayService],
})
export class HolidayModule {}
