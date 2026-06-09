import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';

type ErrorResponseBody = {
  details?: unknown;
  errorCode: string;
  message: string | string[];
  path: string;
  statusCode: number;
  timestamp: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorBody = this.buildErrorResponse(exception, status, request);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${errorBody.errorCode}: ${Array.isArray(errorBody.message) ? errorBody.message.join(', ') : errorBody.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${errorBody.errorCode}: ${Array.isArray(errorBody.message) ? errorBody.message.join(', ') : errorBody.message}`,
      );
    }

    response.status(status).json(errorBody);
  }

  private buildErrorResponse(
    exception: unknown,
    status: number,
    request: Request,
  ): ErrorResponseBody {
    if (exception instanceof AppException) {
      const body = exception.getResponse() as {
        details?: unknown;
        errorCode: string;
        message: string;
      };

      return {
        statusCode: status,
        errorCode: body.errorCode,
        message: body.message,
        path: request.url,
        timestamp: new Date().toISOString(),
        ...(body.details !== undefined ? { details: body.details } : {}),
      };
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode: status,
          errorCode: this.defaultErrorCode(status),
          message: exceptionResponse,
          path: request.url,
          timestamp: new Date().toISOString(),
        };
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as {
          message?: string | string[];
        };
        const message = body.message ?? 'Request failed';
        const details = Array.isArray(message) ? message : undefined;

        return {
          statusCode: status,
          errorCode:
            Array.isArray(message) && status === HttpStatus.BAD_REQUEST
              ? 'VALIDATION_ERROR'
              : this.defaultErrorCode(status),
          message:
            Array.isArray(message) && status === HttpStatus.BAD_REQUEST
              ? 'Validation failed'
              : message,
          path: request.url,
          timestamp: new Date().toISOString(),
          ...(details ? { details } : {}),
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    };
  }

  private defaultErrorCode(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'HTTP_ERROR';
    }
  }
}
