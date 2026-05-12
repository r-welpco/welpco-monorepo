import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PhoneNumberDto } from '../../common/dto/phone-number.dto';
import { AddressDto } from '../../common/dto/address.dto';
import { IsValidPhoneNumber } from '../../common/validators/phone.validator';
import { IsValidAddress } from '../../common/validators/address.validator';

export class CreateCustomerProfileDto {
  @ApiProperty({
    description: 'Customer ID (from User Management)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    description: 'Phone number',
    example: { countryCode: '+1', number: '234567890', formatted: '+1 (234) 567-890' },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneNumberDto)
  @IsValidPhoneNumber()
  phoneNumber?: PhoneNumberDto;

  @ApiProperty({
    description: 'Address',
    example: {
      streetAddress: '123 Main St',
      city: 'City',
      state: 'State',
      zipCode: '12345',
      country: 'USA',
    },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsValidAddress()
  address?: AddressDto;
}

