import { Request, Response, NextFunction } from 'express';
import { InvalidInputError, ExternalAPIError } from './CustomErrors';
/**
 * Express error handling middleware
 */
export declare function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void;
/**
 * Async error wrapper for route handlers
 */
export declare function asyncHandler<T extends Request, U extends Response>(fn: (req: T, res: U, next: NextFunction) => Promise<any>): (req: T, res: U, next: NextFunction) => void;
/**
 * 404 Not Found handler
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * Validation error handler for request validation
 */
export declare function createValidationError(field: string, value: any, expectedFormat: string): InvalidInputError;
/**
 * External API error factory
 */
export declare function createExternalAPIError(apiName: string, originalError?: Error): ExternalAPIError;
//# sourceMappingURL=ErrorHandler.d.ts.map