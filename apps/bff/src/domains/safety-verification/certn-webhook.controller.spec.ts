import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { CertnWebhookController } from './certn-webhook.controller';
import { BackgroundCheckService } from './background-check.service';

describe('CertnWebhookController', () => {
  let controller: CertnWebhookController;
  let backgroundCheckService: { handleCertnWebhook: jest.Mock };
  let configGet: jest.Mock;
  const originalNodeEnv = process.env.NODE_ENV;

  const body = { report_status: 'COMPLETE', applicant_id: 'app-1' };

  const sign = (payload: unknown, secret: string) =>
    createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  beforeEach(async () => {
    backgroundCheckService = { handleCertnWebhook: jest.fn().mockResolvedValue(undefined) };
    configGet = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertnWebhookController],
      providers: [
        { provide: ConfigService, useValue: { get: configGet } },
        { provide: BackgroundCheckService, useValue: backgroundCheckService },
      ],
    }).compile();

    controller = module.get<CertnWebhookController>(CertnWebhookController);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  describe('missing CERTN_WEBHOOK_SECRET', () => {
    it('rejects the webhook in production without processing it (fail-closed)', async () => {
      process.env.NODE_ENV = 'production';
      configGet.mockReturnValue(undefined);

      await expect(controller.handleCertn(body, undefined, undefined)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(backgroundCheckService.handleCertnWebhook).not.toHaveBeenCalled();
    });

    it('accepts the webhook with a warning outside production', async () => {
      process.env.NODE_ENV = 'development';
      configGet.mockReturnValue(undefined);
      const warnSpy = jest
        .spyOn((controller as any).logger, 'warn')
        .mockImplementation(() => undefined);

      await expect(controller.handleCertn(body, undefined, undefined)).resolves.toEqual({
        received: true,
      });
      expect(backgroundCheckService.handleCertnWebhook).toHaveBeenCalledWith(body);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('with CERTN_WEBHOOK_SECRET configured', () => {
    const secret = 'test-secret';

    beforeEach(() => {
      configGet.mockReturnValue(secret);
    });

    it('rejects an invalid signature without processing (any environment)', async () => {
      await expect(
        controller.handleCertn(body, 'sha256=deadbeef', undefined),
      ).rejects.toThrow(BadRequestException);
      expect(backgroundCheckService.handleCertnWebhook).not.toHaveBeenCalled();
    });

    it('rejects a missing signature header without processing', async () => {
      await expect(controller.handleCertn(body, undefined, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(backgroundCheckService.handleCertnWebhook).not.toHaveBeenCalled();
    });

    it('accepts a valid signature (x-certn-signature)', async () => {
      await expect(
        controller.handleCertn(body, `sha256=${sign(body, secret)}`, undefined),
      ).resolves.toEqual({ received: true });
      expect(backgroundCheckService.handleCertnWebhook).toHaveBeenCalledWith(body);
    });

    it('accepts a valid signature via the alternate header (x-webhook-signature)', async () => {
      await expect(
        controller.handleCertn(body, undefined, sign(body, secret)),
      ).resolves.toEqual({ received: true });
      expect(backgroundCheckService.handleCertnWebhook).toHaveBeenCalledWith(body);
    });
  });
});
