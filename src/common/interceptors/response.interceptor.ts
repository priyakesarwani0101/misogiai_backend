import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> {
  status: 'success';
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    return next.handle().pipe(
      map((data) => {
        // You can customize the message here if needed
        const message = '';

        return {
          status: 'success',
          statusCode: response.statusCode,
          message,
          data,
        };
      }),
    );
  }
}
