/**
 * Custom error classes for the disaster info application
 */
export declare class LocationNotFoundError extends Error {
    readonly code = "LOCATION_NOT_FOUND";
    readonly statusCode = 404;
    constructor(message?: string);
}
export declare class InvalidInputError extends Error {
    readonly code = "INVALID_INPUT";
    readonly statusCode = 400;
    constructor(message?: string);
}
export declare class ExternalAPIError extends Error {
    readonly apiName?: string | undefined;
    readonly code = "EXTERNAL_API_ERROR";
    readonly statusCode = 502;
    constructor(message?: string, apiName?: string | undefined);
}
export declare class GeolocationError extends Error {
    readonly code = "GEOLOCATION_ERROR";
    readonly statusCode = 400;
    constructor(message?: string);
}
export declare class SuumoParsingError extends Error {
    readonly code = "SUUMO_PARSING_ERROR";
    readonly statusCode = 400;
    constructor(message?: string);
}
export declare class CacheError extends Error {
    readonly code = "CACHE_ERROR";
    readonly statusCode = 500;
    constructor(message?: string);
}
export declare function isCustomError(error: any): error is LocationNotFoundError | InvalidInputError | ExternalAPIError | GeolocationError | SuumoParsingError | CacheError;
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        statusCode: number;
        apiName?: string;
        timestamp: string;
    };
}
//# sourceMappingURL=CustomErrors.d.ts.map