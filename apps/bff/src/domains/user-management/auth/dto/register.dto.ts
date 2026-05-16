import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsString, IsIn, IsOptional } from 'class-validator';
import { AccountType } from '../../entities/user-account.entity';
import { IsStrongPassword } from '../validators/password.validator';

/** Account types allowed via public registration (Admin is provisioned separately). */
export const REGISTER_ACCOUNT_TYPES = [
  AccountType.CUSTOMER,
  AccountType.WELPER,
  AccountType.GUARDIAN,
] as const;

@ApiSchema({ name: 'DomainAuthRegisterDto' })
export class RegisterDto {
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
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'Account type',
    enum: REGISTER_ACCOUNT_TYPES,
    example: AccountType.CUSTOMER,
  })
  @IsIn(REGISTER_ACCOUNT_TYPES)
  accountType: AccountType;

  @ApiProperty({
    description: 'Referral code to apply during registration',
    example: 'REF123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({
    description: 'Preferred language for emails (en or fr)',
    required: false,
    enum: ['en', 'fr'],
  })
  @IsOptional()
  @IsIn(['en', 'fr'])
  preferredLocale?: 'en' | 'fr';
}

