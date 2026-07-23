import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ResendEmailsClient } from '../../../clients/resend';
import { AdminResendEmailsReportService } from './admin-resend-emails-report.service';

describe('AdminResendEmailsReportService', () => {
  let service: AdminResendEmailsReportService;
  let resendClient: jest.Mocked<
    Pick<ResendEmailsClient, 'listEmails' | 'getEmail'>
  >;

  beforeEach(async () => {
    resendClient = {
      listEmails: jest.fn(),
      getEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminResendEmailsReportService,
        { provide: ResendEmailsClient, useValue: resendClient },
      ],
    }).compile();

    service = module.get(AdminResendEmailsReportService);
  });

  it('lists emails, applies filters, and builds stats from the recent sample', async () => {
    const emails = [
      {
        id: 'email-1',
        from: 'Welpco <updates@updates.welpco.com>',
        to: ['alice@example.com'],
        subject: 'Welcome',
        createdAt: '2026-07-01T10:00:00.000Z',
        lastEvent: 'delivered' as const,
        scheduledAt: null,
        cc: null,
        bcc: null,
        replyTo: null,
      },
      {
        id: 'email-2',
        from: 'Welpco <updates@updates.welpco.com>',
        to: ['bob@example.com'],
        subject: 'Reset password',
        createdAt: '2026-07-01T11:00:00.000Z',
        lastEvent: 'opened' as const,
        scheduledAt: null,
        cc: null,
        bcc: null,
        replyTo: null,
      },
      {
        id: 'email-3',
        from: 'Welpco <updates@updates.welpco.com>',
        to: ['carol@example.com'],
        subject: 'Booking confirmed',
        createdAt: '2026-07-01T12:00:00.000Z',
        lastEvent: 'bounced' as const,
        scheduledAt: null,
        cc: null,
        bcc: null,
        replyTo: null,
      },
    ];

    resendClient.listEmails
      .mockResolvedValueOnce({ emails, hasMore: true })
      .mockResolvedValueOnce({ emails, hasMore: false });

    const report = await service.getEmailsReport({
      to: 'alice',
      limit: 25,
    });

    expect(report.emails).toHaveLength(1);
    expect(report.emails[0]?.id).toBe('email-1');
    expect(report.hasMore).toBe(true);
    expect(report.nextCursor).toBe('email-3');
    expect(report.stats.sampleSize).toBe(3);
    expect(report.stats.deliveredOrOpened).toBe(2);
    expect(report.stats.bouncedOrFailed).toBe(1);
    expect(report.stats.opened).toBe(1);
    expect(report.filters.to).toBe('alice');
  });

  it('rejects unknown lastEvent values', async () => {
    await expect(
      service.getEmailsReport({ lastEvent: 'nope' as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns email detail for preview', async () => {
    resendClient.getEmail.mockResolvedValue({
      id: 'email-1',
      from: 'Welpco <updates@updates.welpco.com>',
      to: ['alice@example.com'],
      subject: 'Welcome',
      createdAt: '2026-07-01T10:00:00.000Z',
      lastEvent: 'delivered',
      scheduledAt: null,
      cc: null,
      bcc: null,
      replyTo: null,
      html: '<p>Hello</p>',
      text: 'Hello',
      tags: [],
    });

    const detail = await service.getEmailDetail('email-1');
    expect(detail.html).toBe('<p>Hello</p>');
    expect(resendClient.getEmail).toHaveBeenCalledWith('email-1');
  });
});
