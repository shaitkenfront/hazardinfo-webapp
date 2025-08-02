/**
 * Custom error classes for the disaster info application
 */

export class LocationNotFoundError extends Error {
  public readonly code = 'LOCATION_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(message: string = '指定された場所が見つかりません') {
    super(message);
    this.name = 'LocationNotFoundError';
    Object.setPrototypeOf(this, LocationNotFoundError.prototype);
  }
}

export class InvalidInputError extends Error {
  public readonly code = 'INVALID_INPUT';
  public readonly statusCode = 400;

  constructor(message: string = '入力形式が無効です') {
    super(message);
    this.name = 'InvalidInputError';
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

export class ExternalAPIError extends Error {
  public readonly code = 'EXTERNAL_API_ERROR';
  public readonly statusCode = 502;

  constructor(message: string = '外部APIとの通信でエラーが発生しました', public readonly apiName?: string) {
    super(message);
    this.name = 'ExternalAPIError';
    Object.setPrototypeOf(this, ExternalAPIError.prototype);
  }
}

export class GeolocationError extends Error {
  public readonly code = 'GEOLOCATION_ERROR';
  public readonly statusCode = 400;

  constructor(message: string = '位置情報の取得に失敗しました') {
    super(message);
    this.name = 'GeolocationError';
    Object.setPrototypeOf(this, GeolocationError.prototype);
  }
}

export class SuumoParsingError extends Error {
  public readonly code = 'SUUMO_PARSING_ERROR';
  public readonly statusCode = 400;

  constructor(message: string = 'SUUMO URLの解析に失敗しました') {
    super(message);
    this.name = 'SuumoParsingError';
    Object.setPrototypeOf(this, SuumoParsingError.prototype);
  }
}

export class CacheError extends Error {
  public readonly code = 'CACHE_ERROR';
  public readonly statusCode = 500;

  constructor(message: string = 'キャッシュ操作でエラーが発生しました') {
    super(message);
    this.name = 'CacheError';
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

// Type guard functions
export function isCustomError(error: any): error is LocationNotFoundError | InvalidInputError | ExternalAPIError | GeolocationError | SuumoParsingError | CacheError {
  return error instanceof LocationNotFoundError ||
         error instanceof InvalidInputError ||
         error instanceof ExternalAPIError ||
         error instanceof GeolocationError ||
         error instanceof SuumoParsingError ||
         error instanceof CacheError;
}

// Error response interface
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    apiName?: string;
    timestamp: string;
  };
}