import { Request, Response, NextFunction } from 'express';
import { 
  isCustomError, 
  ErrorResponse,
  LocationNotFoundError,
  InvalidInputError,
  ExternalAPIError,
  GeolocationError,
  SuumoParsingError,
  CacheError
} from './CustomErrors';

/**
 * Express error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (isCustomError(error)) {
    const errorResponse: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString()
      }
    };

    // Add API name for external API errors
    if (error instanceof ExternalAPIError && error.apiName) {
      errorResponse.error.apiName = error.apiName;
    }

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle unexpected errors
  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '内部サーバーエラーが発生しました',
      statusCode: 500,
      timestamp: new Date().toISOString()
    }
  };

  res.status(500).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: 'リクエストされたリソースが見つかりません',
      statusCode: 404,
      timestamp: new Date().toISOString()
    }
  };

  res.status(404).json(errorResponse);
}

/**
 * Validation error handler for request validation
 */
export function createValidationError(field: string, value: any, expectedFormat: string): InvalidInputError {
  return new InvalidInputError(`${field}の形式が無効です。期待される形式: ${expectedFormat}。入力値: ${value}`);
}

/**
 * External API error factory
 */
export function createExternalAPIError(apiName: string, originalError?: Error): ExternalAPIError {
  const message = originalError 
    ? `${apiName} APIでエラーが発生しました: ${originalError.message}`
    : `${apiName} APIでエラーが発生しました`;
  
  return new ExternalAPIError(message, apiName);
}