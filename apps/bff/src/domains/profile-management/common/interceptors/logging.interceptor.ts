import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    // Log request (excluding sensitive data)
    const sanitizedBody = this.sanitizeBody(body);
    this.logger.log(
      `${method} ${url} - Body: ${JSON.stringify(sanitizedBody)} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(params)}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `${method} ${url} - ${responseTime}ms - Status: 200`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `${method} ${url} - ${responseTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

