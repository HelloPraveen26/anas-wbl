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
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = headers['x-forwarded-for'] || request.connection.remoteAddress;

    const startTime = Date.now();

    // Log request
    this.logger.log(
      `📥 ${method} ${url} - ${ip} - ${userAgent}`,
      'Request',
    );

    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      if (Object.keys(query).length > 0) {
        this.logger.debug(`Query: ${JSON.stringify(query)}`, 'Request');
      }
      if (Object.keys(params).length > 0) {
        this.logger.debug(`Params: ${JSON.stringify(params)}`, 'Request');
      }
      if (body && Object.keys(body).length > 0) {
        // Don't log sensitive data
        const sanitizedBody = { ...body };
        if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
        this.logger.debug(`Body: ${JSON.stringify(sanitizedBody)}`, 'Request');
      }
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log response
          this.logger.log(
            `📤 ${method} ${url} - ${statusCode} - ${duration}ms`,
            'Response',
          );

          // Log response data in development (limited)
          if (process.env.NODE_ENV === 'development' && data) {
            const responseSize = JSON.stringify(data).length;
            this.logger.debug(`Response size: ${responseSize} bytes`, 'Response');
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `❌ ${method} ${url} - ${statusCode} - ${duration}ms - ${error.message}`,
            error.stack,
            'Response',
          );
        },
      }),
    );
  }
}