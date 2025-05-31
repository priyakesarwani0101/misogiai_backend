import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  data: null;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      // `getResponse()` may be a string or object; normalize to a string message
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (
        typeof res === 'object' &&
        (res as any).message !== undefined
      ) {
        // res.message can be string or string[]
        const msg = (res as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : msg;
      } else {
        message = exception.message;
      }
    } else {
      // Non-HTTP exception (unhandled); treat as 500 Internal Server Error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = (exception as any).message || 'Internal server error';
    }

    const errorResponse: ErrorResponse = {
      status: 'error',
      statusCode: status,
      message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
