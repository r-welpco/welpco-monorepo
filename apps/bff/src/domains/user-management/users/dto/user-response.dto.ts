import { ApiProperty } from '@nestjs/swagger';
import { AccountType, AccountStatus } from '../../entities/user-account.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: AccountType })
  accountType: AccountType;

  @ApiProperty({ enum: AccountStatus })
  status: AccountStatus;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  lastLoginAt: Date | null;
}

