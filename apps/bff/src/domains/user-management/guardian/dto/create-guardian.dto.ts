import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { RelationshipType } from '../../entities/guardian-account.entity';

export class CreateGuardianDto {
  @ApiProperty({
    description: 'Minor user ID',
    example: 'uuid-of-minor-user',
  })
  @IsString()
  @IsNotEmpty()
  minorUserId: string;

  @ApiProperty({
    description: 'Relationship type',
    enum: RelationshipType,
    example: RelationshipType.PARENT,
  })
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;
}

