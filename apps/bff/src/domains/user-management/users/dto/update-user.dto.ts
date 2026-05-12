import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}

