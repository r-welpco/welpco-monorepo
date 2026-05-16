import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { PreferredLocaleOptionalDto } from './preferred-locale.dto';

export enum AccountType {
  CUSTOMER = 'Customer',
  WELPER = 'Welper',
}

@ApiSchema({ name: 'BffAuthRegisterDto' })
export class RegisterDto extends PreferredLocaleOptionalDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.CUSTOMER,
  })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({
    description: 'Referral code to apply during registration',
    example: 'REF123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
