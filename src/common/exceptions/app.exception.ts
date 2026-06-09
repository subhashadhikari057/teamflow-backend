import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppExceptionOptions {
  details?: unknown;
  status: HttpStatus;
}

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    options: AppExceptionOptions,
  ) {
    super(
      {
        errorCode,
        message,
        ...(options.details !== undefined ? { details: options.details } : {}),
      },
      options.status,
    );
  }
}
