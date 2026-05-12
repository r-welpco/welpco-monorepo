import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { AccountStatus } from '../../entities/user-account.entity';
import { StatusChangeReasonCode } from './status-change-reason-code.enum';

@ValidatorConstraint({ name: 'reasonDetailMatchesModeration', async: false })
export class ReasonDetailMatchesModerationConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const o = args.object as UpdateUserAccountStatusDto;
    const needsModeration =
      o.status === AccountStatus.SUSPENDED || o.status === AccountStatus.DEACTIVATED;
    if (!needsModeration) return true;
    if (o.reasonCode === StatusChangeReasonCode.OTHER) {
      return typeof value === 'string' && value.trim().length >= 1 && value.length <= 2000;
    }
    if (value == null || value === '') return true;
    return typeof value === 'string' && value.length <= 2000;
  }

  defaultMessage(): string {
    return 'reasonDetail is required when reason is other';
  }
}

export class UpdateUserAccountStatusDto {
  @ApiProperty({ enum: AccountStatus })
  @IsEnum(AccountStatus)
  status!: AccountStatus;

  @ApiPropertyOptional({
    enum: StatusChangeReasonCode,
    description: 'Required when status is Suspended or Deactivated',
  })
  @ValidateIf(
    (o: UpdateUserAccountStatusDto) =>
      o.status === AccountStatus.SUSPENDED || o.status === AccountStatus.DEACTIVATED,
  )
  @IsEnum(StatusChangeReasonCode, { message: 'reasonCode is required for Suspended or Deactivated' })
  reasonCode?: StatusChangeReasonCode;

  @ApiPropertyOptional({
    description: 'Required when reasonCode is other; optional otherwise for Suspended/Deactivated',
  })
  @Validate(ReasonDetailMatchesModerationConstraint)
  reasonDetail?: string;
}
