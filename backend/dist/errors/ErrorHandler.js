"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
exports.createValidationError = createValidationError;
exports.createExternalAPIError = createExternalAPIError;
const CustomErrors_1 = require("./CustomErrors");
/**
 * Express error handling middleware
 */
function errorHandler(error, req, res, next) {
    console.error('Error occurred:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    if ((0, CustomErrors_1.isCustomError)(error)) {
        const errorResponse = {
            error: {
                code: error.code,
                message: error.message,
                statusCode: error.statusCode,
                timestamp: new Date().toISOString()
            }
        };
        // Add API name for external API errors
        if (error instanceof CustomErrors_1.ExternalAPIError && error.apiName) {
            errorResponse.error.apiName = error.apiName;
        }
        res.status(error.statusCode).json(errorResponse);
        return;
    }
    // Handle unexpected errors
    const errorResponse = {
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
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    const errorResponse = {
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
function createValidationError(field, value, expectedFormat) {
    return new CustomErrors_1.InvalidInputError(`${field}の形式が無効です。期待される形式: ${expectedFormat}。入力値: ${value}`);
}
/**
 * External API error factory
 */
function createExternalAPIError(apiName, originalError) {
    const message = originalError
        ? `${apiName} APIでエラーが発生しました: ${originalError.message}`
        : `${apiName} APIでエラーが発生しました`;
    return new CustomErrors_1.ExternalAPIError(message, apiName);
}
//# sourceMappingURL=ErrorHandler.js.map