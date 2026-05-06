// backend/src/common/responses/api-response.ts
export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly data?: T;
  public readonly error?: ApiError;
  public readonly meta?: ApiMeta;

  constructor(success: boolean, data?: T, error?: ApiError, meta?: ApiMeta) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.meta = meta;
  }
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
  version?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Factory functions for common responses
export class ResponseFactory {
  static success<T>(data: T, meta?: Partial<ApiMeta>): ApiResponse<T> {
    return new ApiResponse(true, data, undefined, {
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      ...meta,
    });
  }

  static error(error: ApiError, meta?: Partial<ApiMeta>): ApiResponse {
    return new ApiResponse(
      false,
      undefined,
      {
        ...error,
        timestamp: new Date().toISOString(),
      },
      {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        ...meta,
      },
    );
  }

  static paginated<T>(
    data: T,
    pagination: PaginationMeta,
    meta?: Partial<ApiMeta>,
  ): ApiResponse<T> {
    return new ApiResponse(true, data, undefined, {
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      pagination,
      ...meta,
    });
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}