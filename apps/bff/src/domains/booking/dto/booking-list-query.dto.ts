import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { BookingRequestStatus } from '../entities/booking-request.entity';

export class BookingListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: BookingRequestStatus })
  @IsOptional()
  @IsEnum(BookingRequestStatus)
  status?: BookingRequestStatus;

  @ApiPropertyOptional({ description: 'Filter by role (customer or welper)', enum: ['customer', 'welper'] })
  @IsOptional()
  @IsString()
  role?: 'customer' | 'welper';

  @ApiPropertyOptional({ description: 'Filter bookings from this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter bookings until this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)', default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page (default 20)', default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsNumber()
  @Min(1)
  limit?: number;
}
