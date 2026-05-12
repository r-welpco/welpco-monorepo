import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SelectedRole } from '../../../domains/user-management/entities/user-account.entity';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Step 2 of the wizard. Locks the role choice. Once a row has a non-null
 * `selectedRole`, the orchestrator rejects re-selection — the wizard is a
 * one-way state machine. To switch role, abandon the partial signup and
 * begin again with a different email (rare; product accepts the friction).
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
