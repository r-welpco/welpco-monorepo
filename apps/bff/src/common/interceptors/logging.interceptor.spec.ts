import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('redacts tokens from URLs, queries, and nested bodies', (done) => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/api/verification/guardian/review?token=secret-token&safe=yes',
          body: { nested: { refreshToken: 'refresh-secret' } },
          query: { token: 'secret-token', safe: 'yes' },
          params: {},
        }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of({ ok: true }) } as CallHandler;

    new LoggingInterceptor().intercept(context, next).subscribe({
      complete: () => {
        const output = log.mock.calls.flat().join(' ');
        expect(output).not.toContain('secret-token');
        expect(output).not.toContain('refresh-secret');
        expect(output).toContain('REDACTED');
        expect(output).toContain('safe=yes');
        log.mockRestore();
        done();
      },
    });
  });
});
