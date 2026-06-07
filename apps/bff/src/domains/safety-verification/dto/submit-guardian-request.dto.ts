import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { RelationshipType } from '../../user-management/entities/guardian-account.entity';

export class SubmitGuardianRequestDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  guardianFullName!: string;

  @ApiProperty({ example: 'jane.smith@example.com' })
  @IsEmail()
  @MaxLength(255)
  guardianEmail!: string;

  @ApiProperty({ example: '+14165551234' })
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  guardianPhone!: string;

  @ApiProperty({ enum: RelationshipType, example: RelationshipType.PARENT })
  @IsEnum(RelationshipType)
  relationshipType!: RelationshipType;
}
