import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { redactSensitiveUrl } from '../interceptors/logging.interceptor';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestPath = redactSensitiveUrl(request.url);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error
    this.logger.error(
      `${request.method} ${requestPath} - Status: ${status} - Message: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const messageText =
      typeof message === 'string'
        ? message
        : (message as any)?.message || 'An error occurred';

    // Format error response for frontend
    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: requestPath,
      method: request.method,
      message: messageText,
    };
    if (typeof message === 'object' && message !== null) {
      const structured = message as Record<string, unknown>;
      if (typeof structured.code === 'string') {
        errorResponse.code = structured.code;
      }
      if (Array.isArray(structured.missingFields)) {
        errorResponse.missingFields = structured.missingFields;
      }
      if (
        typeof structured.nextStep === 'string' ||
        structured.nextStep === null
      ) {
        errorResponse.nextStep = structured.nextStep;
      }
      if (Array.isArray(structured.violations)) {
        errorResponse.violations = structured.violations;
      }
      if (Array.isArray(structured.fields)) {
        errorResponse.fields = structured.fields;
      }
    }

    // Don't expose internal errors in production
    if (
      status === HttpStatus.INTERNAL_SERVER_ERROR &&
      process.env.NODE_ENV === 'production'
    ) {
      errorResponse.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }
}
