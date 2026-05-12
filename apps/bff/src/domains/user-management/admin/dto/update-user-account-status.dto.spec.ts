import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AccountStatus } from '../../entities/user-account.entity';
import { StatusChangeReasonCode } from './status-change-reason-code.enum';
import { UpdateUserAccountStatusDto } from './update-user-account-status.dto';

async function validateDto(plain: object): Promise<string[]> {
  const dto = plainToInstance(UpdateUserAccountStatusDto, plain);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return errors.flatMap((e) => (e.constraints ? Object.values(e.constraints) : []));
}

describe('UpdateUserAccountStatusDto', () => {
  it('accepts Active without reason', async () => {
    const msgs = await validateDto({ status: AccountStatus.ACTIVE });
    expect(msgs).toHaveLength(0);
  });

  it('requires reasonCode when Suspended', async () => {
    const msgs = await validateDto({ status: AccountStatus.SUSPENDED });
    expect(msgs.some((m) => m.includes('reasonCode') || m.includes('required'))).toBe(true);
  });

  it('requires reasonDetail when other', async () => {
    const msgs = await validateDto({
      status: AccountStatus.SUSPENDED,
      reasonCode: StatusChangeReasonCode.OTHER,
    });
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs.some((m) => m.toLowerCase().includes('other'))).toBe(true);
  });

  it('accepts Suspended with non-other code and no detail', async () => {
    const msgs = await validateDto({
      status: AccountStatus.DEACTIVATED,
      reasonCode: StatusChangeReasonCode.FRAUD,
    });
    expect(msgs).toHaveLength(0);
  });

  it('accepts Suspended with other and detail', async () => {
    const msgs = await validateDto({
      status: AccountStatus.SUSPENDED,
      reasonCode: StatusChangeReasonCode.OTHER,
      reasonDetail: 'Custom explanation for the team.',
    });
    expect(msgs).toHaveLength(0);
  });
});
