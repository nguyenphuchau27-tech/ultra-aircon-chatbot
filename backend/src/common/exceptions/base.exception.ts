// backend/src/common/exceptions/base.exception.ts
export abstract class BaseException extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;

    // Log details if provided (for debugging)
    if (details && process.env.NODE_ENV === 'development') {
      console.debug(`${this.name} details:`, details);
    }
  }
}

// Specific business exceptions
export class ValidationException extends BaseException {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class NotFoundException extends BaseException {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

export class BusinessLogicException extends BaseException {
  readonly code = 'BUSINESS_LOGIC_ERROR';
  readonly statusCode = 422;
}

export class AuthenticationException extends BaseException {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
}

export class AuthorizationException extends BaseException {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
}

export class ExternalServiceException extends BaseException {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;
}

export class DatabaseException extends BaseException {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;
}



