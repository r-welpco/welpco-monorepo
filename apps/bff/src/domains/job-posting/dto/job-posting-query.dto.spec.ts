import { plainToInstance } from 'class-transformer';
import { JobPostingBrowseQueryDto } from './job-posting-query.dto';

describe('JobPostingBrowseQueryDto', () => {
  it('parses eligibleOnly=false as false', () => {
    const dto = plainToInstance(
      JobPostingBrowseQueryDto,
      { eligibleOnly: 'false' },
      { enableImplicitConversion: true },
    );
    expect(dto.eligibleOnly).toBe(false);
  });

  it('parses eligibleOnly=true as true', () => {
    const dto = plainToInstance(
      JobPostingBrowseQueryDto,
      { eligibleOnly: 'true' },
      { enableImplicitConversion: true },
    );
    expect(dto.eligibleOnly).toBe(true);
  });

  it('leaves eligibleOnly undefined when omitted', () => {
    const dto = plainToInstance(JobPostingBrowseQueryDto, {}, { enableImplicitConversion: true });
    expect(dto.eligibleOnly).toBeUndefined();
  });
});
