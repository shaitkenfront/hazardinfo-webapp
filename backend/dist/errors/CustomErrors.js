"use strict";
/**
 * Custom error classes for the disaster info application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheError = exports.SuumoParsingError = exports.GeolocationError = exports.ExternalAPIError = exports.InvalidInputError = exports.LocationNotFoundError = void 0;
exports.isCustomError = isCustomError;
class LocationNotFoundError extends Error {
    constructor(message = '指定された場所が見つかりません') {
        super(message);
        this.code = 'LOCATION_NOT_FOUND';
        this.statusCode = 404;
        this.name = 'LocationNotFoundError';
        Object.setPrototypeOf(this, LocationNotFoundError.prototype);
    }
}
exports.LocationNotFoundError = LocationNotFoundError;
class InvalidInputError extends Error {
    constructor(message = '入力形式が無効です') {
        super(message);
        this.code = 'INVALID_INPUT';
        this.statusCode = 400;
        this.name = 'InvalidInputError';
        Object.setPrototypeOf(this, InvalidInputError.prototype);
    }
}
exports.InvalidInputError = InvalidInputError;
class ExternalAPIError extends Error {
    constructor(message = '外部APIとの通信でエラーが発生しました', apiName) {
        super(message);
        this.apiName = apiName;
        this.code = 'EXTERNAL_API_ERROR';
        this.statusCode = 502;
        this.name = 'ExternalAPIError';
        Object.setPrototypeOf(this, ExternalAPIError.prototype);
    }
}
exports.ExternalAPIError = ExternalAPIError;
class GeolocationError extends Error {
    constructor(message = '位置情報の取得に失敗しました') {
        super(message);
        this.code = 'GEOLOCATION_ERROR';
        this.statusCode = 400;
        this.name = 'GeolocationError';
        Object.setPrototypeOf(this, GeolocationError.prototype);
    }
}
exports.GeolocationError = GeolocationError;
class SuumoParsingError extends Error {
    constructor(message = 'SUUMO URLの解析に失敗しました') {
        super(message);
        this.code = 'SUUMO_PARSING_ERROR';
        this.statusCode = 400;
        this.name = 'SuumoParsingError';
        Object.setPrototypeOf(this, SuumoParsingError.prototype);
    }
}
exports.SuumoParsingError = SuumoParsingError;
class CacheError extends Error {
    constructor(message = 'キャッシュ操作でエラーが発生しました') {
        super(message);
        this.code = 'CACHE_ERROR';
        this.statusCode = 500;
        this.name = 'CacheError';
        Object.setPrototypeOf(this, CacheError.prototype);
    }
}
exports.CacheError = CacheError;
// Type guard functions
function isCustomError(error) {
    return error instanceof LocationNotFoundError ||
        error instanceof InvalidInputError ||
        error instanceof ExternalAPIError ||
        error instanceof GeolocationError ||
        error instanceof SuumoParsingError ||
        error instanceof CacheError;
}
//# sourceMappingURL=CustomErrors.js.map