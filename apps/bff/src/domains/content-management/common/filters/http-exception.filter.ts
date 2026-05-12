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

  private getErrorCode(status: number, message: string | string[]): ErrorCode {
    // Convert message to string if it's an array (validation errors)
    const messageStr = Array.isArray(message) 
      ? message.join(' ') 
      : typeof message === 'string' 
        ? message 
        : String(message);
    
    const lowerMessage = messageStr.toLowerCase();
    
    // Map common HTTP status codes and messages to error codes
    if (status === HttpStatus.NOT_FOUND) {
      if (lowerMessage.includes('category')) {
        return ErrorCode.CATEGORY_NOT_FOUND;
      }
      if (lowerMessage.includes('question')) {
        return ErrorCode.QUESTION_NOT_FOUND;
      }
      if (lowerMessage.includes('content')) {
        return ErrorCode.CONTENT_NOT_FOUND;
      }
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      return ErrorCode.UNAUTHORIZED;
    }

    if (status === HttpStatus.FORBIDDEN) {
      return ErrorCode.FORBIDDEN;
    }

    if (status === HttpStatus.BAD_REQUEST) {
      return ErrorCode.VALIDATION_ERROR;
    }

    if (status === HttpStatus.CONFLICT) {
      if (lowerMessage.includes('category')) {
        return ErrorCode.CATEGORY_ALREADY_EXISTS;
      }
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

    // Extract message text - handle arrays (validation errors) and objects
    let messageText: string | string[];
    if (typeof message === 'string') {
      messageText = message;
    } else if (Array.isArray(message)) {
      messageText = message;
    } else if (typeof message === 'object' && message !== null) {
      if ((message as any).message && Array.isArray((message as any).message)) {
        messageText = (message as any).message;
      } else {
        messageText = (message as any).message || JSON.stringify(message);
      }
    } else {
      messageText = 'An error occurred';
    }

    // Format error response
    const errorResponse: any = {
      statusCode: status,
      errorCode: this.getErrorCode(status, messageText),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(messageText) ? messageText : messageText,
    };

    // Add additional error details if message is an object
    if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
      const messageObj = message as any;
      if (messageObj.message && !Array.isArray(messageObj.message)) {
        Object.assign(errorResponse, messageObj);
      }
    }

    // Don't expose internal errors in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      errorResponse.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }
}
