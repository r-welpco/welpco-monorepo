import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SelectedRole } from '../../../domains/user-management/entities/user-account.entity';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Step 2 of the wizard. Role is locked once identity is submitted; before
 * that the user may go back from the identity step and choose again.
 */
export class SelectRoleStepDto {
  @ApiProperty({
    description:
      'Role chosen by the user at step 1 of the wizard. Locked once written.',
    enum: SelectedRole,
    example: SelectedRole.CUSTOMER,
  })
  @IsEnum(SelectedRole)
  role!: SelectedRole;
}
