import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationCategory } from '../../../domains/notification/entities';

export class NotificationPreferenceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationCategory })
  category!: string;

  @ApiProperty()
  emailEnabled!: boolean;

  @ApiProperty()
  inAppEnabled!: boolean;
}

export class UpdatePreferenceItemDto {
  @ApiProperty({ enum: NotificationCategory })
  @IsEnum(NotificationCategory)
  category!: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({ type: [UpdatePreferenceItemDto], description: 'Per-category preferences to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePreferenceItemDto)
  preferences!: UpdatePreferenceItemDto[];
}
