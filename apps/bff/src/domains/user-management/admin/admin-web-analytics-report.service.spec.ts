import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VercelWebAnalyticsClient } from '../../../clients/vercel';
import { AdminWebAnalyticsReportService } from './admin-web-analytics-report.service';

describe('AdminWebAnalyticsReportService', () => {
  let service: AdminWebAnalyticsReportService;
  let vercelClient: jest.Mocked<
    Pick<VercelWebAnalyticsClient, 'countVisits' | 'aggregateVisits'>
  >;

  beforeEach(async () => {
    vercelClient = {
      countVisits: jest.fn(),
      aggregateVisits: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminWebAnalyticsReportService,
        { provide: VercelWebAnalyticsClient, useValue: vercelClient },
      ],
    }).compile();

    service = module.get(AdminWebAnalyticsReportService);
  });

  describe('resolveDateRange', () => {
    it('defaults to a 7-day window ending today UTC', () => {
      const { since, until } = service.resolveDateRange();
      const untilDate = new Date(`${until}T00:00:00.000Z`);
      const sinceDate = new Date(`${since}T00:00:00.000Z`);
      const days =
        Math.floor(
          (untilDate.getTime() - sinceDate.getTime()) / (24 * 60 * 60 * 1000),
        ) + 1;
      expect(days).toBe(7);
      expect(until).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('rejects invalid date formats', () => {
      expect(() => service.resolveDateRange('07-01-2026')).toThrow(
        BadRequestException,
      );
    });

    it('rejects since after until', () => {
      expect(() =>
        service.resolveDateRange('2026-07-10', '2026-07-01'),
      ).toThrow(BadRequestException);
    });

    it('rejects ranges longer than 90 days', () => {
      expect(() =>
        service.resolveDateRange('2026-01-01', '2026-04-15'),
      ).toThrow(BadRequestException);
    });
  });

  describe('getWebAnalyticsReport', () => {
    it('aggregates Vercel visit queries into a marketing report', async () => {
      vercelClient.countVisits.mockResolvedValue({
        version: 1,
        query: {},
        data: { pageviews: 1200, visitors: 900 },
      });
      vercelClient.aggregateVisits.mockImplementation(async (params) => {
        const by = Array.isArray(params.by) ? params.by[0] : params.by;
        if (by === 'day') {
          return {
            version: 1,
            query: {},
            data: [
              {
                timestamp: '2026-07-01T00:00:00.000Z',
                pageviews: 100,
                visitors: 80,
              },
              {
                timestamp: '2026-07-02T00:00:00.000Z',
                pageviews: 150,
                visitors: 110,
              },
            ],
          };
        }
        if (by === 'requestPath') {
          return {
            version: 1,
            query: {},
            data: [{ requestPath: '/', pageviews: 500, visitors: 400 }],
          };
        }
        if (by === 'referrerHostname') {
          return {
            version: 1,
            query: {},
            data: [
              { referrerHostname: 'google.com', pageviews: 200, visitors: 180 },
            ],
          };
        }
        if (by === 'country') {
          return {
            version: 1,
            query: {},
            data: [{ country: 'CA', pageviews: 700, visitors: 600 }],
          };
        }
        return {
          version: 1,
          query: {},
          data: [{ deviceType: 'desktop', pageviews: 800, visitors: 650 }],
        };
      });

      const report = await service.getWebAnalyticsReport({
        since: '2026-07-01',
        until: '2026-07-07',
        environment: 'production',
      });

      expect(report.since).toBe('2026-07-01');
      expect(report.until).toBe('2026-07-07');
      expect(report.environment).toBe('production');
      expect(report.summary).toEqual({ pageviews: 1200, visitors: 900 });
      expect(report.daily).toEqual([
        { date: '2026-07-01', pageviews: 100, visitors: 80 },
        { date: '2026-07-02', pageviews: 150, visitors: 110 },
      ]);
      expect(report.topPages[0]).toEqual({
        label: '/',
        pageviews: 500,
        visitors: 400,
      });
      expect(report.topReferrers[0].label).toBe('google.com');
      expect(report.countries[0].label).toBe('CA');
      expect(report.devices[0].label).toBe('desktop');
      expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      expect(vercelClient.countVisits).toHaveBeenCalledWith({
        since: '2026-07-01',
        until: '2026-07-07',
        filter: "environment eq 'production'",
      });
      expect(vercelClient.aggregateVisits).toHaveBeenCalledTimes(5);
    });

    it('omits environment filter when environment is all', async () => {
      vercelClient.countVisits.mockResolvedValue({
        version: 1,
        query: {},
        data: { pageviews: 0, visitors: 0 },
      });
      vercelClient.aggregateVisits.mockResolvedValue({
        version: 1,
        query: {},
        data: [],
      });

      await service.getWebAnalyticsReport({
        since: '2026-07-01',
        until: '2026-07-02',
        environment: 'all',
      });

      expect(vercelClient.countVisits).toHaveBeenCalledWith({
        since: '2026-07-01',
        until: '2026-07-02',
        filter: undefined,
      });
    });
  });
});
