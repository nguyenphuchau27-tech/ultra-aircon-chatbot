import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  ResponseFactory,
  PaginationMeta,
} from '../responses/api-response';
import { BaseException } from '../exceptions/base.exception';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (this.isApiResponse(data)) {
          return data;
        }

        if (this.isPaginatedResponse(data)) {
          return ResponseFactory.paginated(data.items, data.meta);
        }

        return ResponseFactory.success(data);
      }),
      catchError((error: unknown) => {
        if (error instanceof BaseException) {
          return of(this.handleBusinessException(error));
        }

        if (this.isValidationError(error)) {
          return of(this.handleValidationError(error));
        }

        if (this.getErrorStatus(error) === 401) {
          return of(this.handleAuthenticationError());
        }

        if (this.getErrorStatus(error) === 403) {
          return of(this.handleAuthorizationError());
        }

        if (this.getErrorStatus(error) === 404) {
          return of(this.handleNotFoundError());
        }

        if (this.isDatabaseError(error)) {
          return of(this.handleDatabaseError(error));
        }

        if (this.isExternalServiceError(error)) {
          return of(this.handleExternalServiceError(error));
        }

        return of(this.handleUnknownError(error));
      }),
    );
  }

  private isApiResponse(data: unknown): boolean {
    return !!data && typeof data === 'object' && 'success' in data;
  }

  private isPaginatedResponse(
    data: unknown,
  ): data is { items: unknown[]; meta: PaginationMeta } {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!('items' in data) || !('meta' in data)) {
      return false;
    }

    const candidate = data as { items?: unknown; meta?: unknown };

    if (!Array.isArray(candidate.items)) {
      return false;
    }

    return this.isPaginationMeta(candidate.meta);
  }

  private isPaginationMeta(meta: unknown): meta is PaginationMeta {
    if (!meta || typeof meta !== 'object') {
      return false;
    }

    const candidate = meta as Record<string, unknown>;

    return (
      typeof candidate.page === 'number' &&
      typeof candidate.limit === 'number' &&
      typeof candidate.total === 'number' &&
      typeof candidate.totalPages === 'number' &&
      typeof candidate.hasNext === 'boolean' &&
      typeof candidate.hasPrev === 'boolean'
    );
  }

  private handleBusinessException(error: BaseException) {
    return ResponseFactory.error({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  private handleValidationError(error: unknown) {
    const normalized = this.asErrorRecord(error);
    const details = normalized.errors ?? normalized.details ?? {};

    return ResponseFactory.error({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    });
  }

  private handleAuthenticationError() {
    return ResponseFactory.error({
      code: 'AUTHENTICATION_ERROR',
      message: 'Authentication required',
    });
  }

  private handleAuthorizationError() {
    return ResponseFactory.error({
      code: 'AUTHORIZATION_ERROR',
      message: 'Insufficient permissions',
    });
  }

  private handleNotFoundError() {
    return ResponseFactory.error({
      code: 'NOT_FOUND',
      message: 'Resource not found',
    });
  }

  private handleDatabaseError(error: unknown) {
    return ResponseFactory.error({
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
      details:
        process.env.NODE_ENV === 'development'
          ? this.getErrorMessage(error)
          : undefined,
    });
  }

  private handleExternalServiceError(error: unknown) {
    return ResponseFactory.error({
      code: 'EXTERNAL_SERVICE_ERROR',
      message: 'External service unavailable',
      details:
        process.env.NODE_ENV === 'development'
          ? this.getErrorMessage(error)
          : undefined,
    });
  }

  private handleUnknownError(error: unknown) {
    console.error('Unhandled error:', error);

    return ResponseFactory.error({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details:
        process.env.NODE_ENV === 'development'
          ? this.getErrorMessage(error)
          : undefined,
    });
  }

  private isValidationError(error: unknown): boolean {
    const normalized = this.asErrorRecord(error);
    return (
      normalized.name === 'ValidationError' ||
      this.getErrorStatus(error) === 400
    );
  }

  private isDatabaseError(error: unknown): boolean {
    const normalized = this.asErrorRecord(error);
    return (
      typeof normalized.code === 'string' &&
      normalized.code.startsWith('23')
    );
  }

  private isExternalServiceError(error: unknown): boolean {
    const normalized = this.asErrorRecord(error);
    return (
      normalized.isAxiosError === true ||
      normalized.code === 'ECONNREFUSED'
    );
  }

  private getErrorStatus(error: unknown): number | undefined {
    const normalized = this.asErrorRecord(error);
    return typeof normalized.status === 'number'
      ? normalized.status
      : undefined;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    const normalized = this.asErrorRecord(error);
    if (typeof normalized.message === 'string') {
      return normalized.message;
    }

    return 'Unknown error';
  }

  private asErrorRecord(error: unknown): Record<string, any> {
    if (error && typeof error === 'object') {
      return error as Record<string, any>;
    }

    return {};
  }
}