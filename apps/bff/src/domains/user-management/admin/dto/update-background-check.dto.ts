import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BackgroundCheckStatus } from '../../entities/verification-status.entity';

export class UpdateBackgroundCheckDto {
  @ApiProperty({
    description: 'Background check status',
    enum: BackgroundCheckStatus,
    example: BackgroundCheckStatus.PASSED,
  })
  @IsEnum(BackgroundCheckStatus)
  status: BackgroundCheckStatus;
}

