import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SENSITIVE_FIELDS = new Set([
  'authorization',
  'code',
  'currentpassword',
  'newpassword',
  'password',
  'refreshtoken',
  'secret',
  'token',
]);

function isSensitiveField(field: string): boolean {
  return SENSITIVE_FIELDS.has(field.replace(/[_-]/g, '').toLowerCase());
}

export function redactSensitiveUrl(url: string): string {
  const [path, queryString] = url.split('?', 2);
  if (!queryString) return path;
  const query = new URLSearchParams(queryString);
  for (const key of query.keys()) {
    if (isSensitiveField(key)) {
      query.set(key, '***REDACTED***');
    }
  }
  return `${path}?${query.toString()}`;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    const sanitizedUrl = redactSensitiveUrl(url);
    this.logger.log(
      `${method} ${sanitizedUrl} - Body: ${JSON.stringify(this.sanitizeValue(body))} - Query: ${JSON.stringify(this.sanitizeValue(query))} - Params: ${JSON.stringify(this.sanitizeValue(params))}`,
    );

    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `${method} ${sanitizedUrl} - ${responseTime}ms - Status: ${response.statusCode}`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `${method} ${sanitizedUrl} - ${responseTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (isSensitiveField(key)) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = this.sanitizeValue(item);
      }
    }
    return sanitized;
  }

}
