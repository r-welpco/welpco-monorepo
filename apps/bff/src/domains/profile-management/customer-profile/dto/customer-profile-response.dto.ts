import { ApiProperty } from '@nestjs/swagger';
import { ProfileCompletionStatus } from '../../entities/profile-completion-status.enum';

export class CustomerProfileResponseDto {
  @ApiProperty({ description: 'Profile ID' })
  id: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Phone number', nullable: true })
  phoneNumber: any | null;

  @ApiProperty({ description: 'Address', nullable: true })
  address: any | null;

  @ApiProperty({
    description: 'Profile completion status',
    enum: ProfileCompletionStatus,
  })
  profileCompletionStatus: ProfileCompletionStatus;

  @ApiProperty({ description: 'Onboarding completed' })
  onboardingCompleted: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

