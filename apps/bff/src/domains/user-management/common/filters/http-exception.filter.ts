import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../../../../common/types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private getErrorCode(status: number, message: string): ErrorCode {
    // Map common HTTP status codes and messages to error codes
    if (status === HttpStatus.NOT_FOUND) {
      if (message.toLowerCase().includes('user')) {
        return ErrorCode.USER_NOT_FOUND;
      }
      if (message.toLowerCase().includes('profile')) {
        return ErrorCode.PROFILE_NOT_FOUND;
      }
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      return ErrorCode.UNAUTHORIZED;
    }

    if (status === HttpStatus.FORBIDDEN) {
      return ErrorCode.FORBIDDEN;
    }

    if (status === HttpStatus.BAD_REQUEST) {
      if (message.toLowerCase().includes('email')) {
        return ErrorCode.EMAIL_ALREADY_EXISTS;
      }
      if (message.toLowerCase().includes('phone')) {
        return ErrorCode.INVALID_PHONE_NUMBER;
      }
      if (message.toLowerCase().includes('address')) {
        return ErrorCode.INVALID_ADDRESS;
      }
      if (message.toLowerCase().includes('geojson') || message.toLowerCase().includes('service area')) {
        return ErrorCode.INVALID_GEOJSON;
      }
      return ErrorCode.VALIDATION_ERROR;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return ErrorCode.INTERNAL_SERVER_ERROR;
    }

    return ErrorCode.INTERNAL_SERVER_ERROR;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const messageText =
      typeof message === 'string'
        ? message
        : (message as any)?.message || 'An error occurred';

    // Format error response
    const errorResponse = {
      statusCode: status,
      errorCode: this.getErrorCode(status, messageText),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: messageText,
      ...(typeof message === 'object' && !(message as any)?.message
        ? message
        : {}),
    };

    // Don't expose internal errors in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      errorResponse.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }
}

