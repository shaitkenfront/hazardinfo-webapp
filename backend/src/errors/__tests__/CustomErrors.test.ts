import {
  LocationNotFoundError,
  InvalidInputError,
  ExternalAPIError,
  GeolocationError,
  SuumoParsingError,
  CacheError,
  isCustomError
} from '../CustomErrors';

describe('CustomErrors', () => {
  describe('LocationNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new LocationNotFoundError();
      
      expect(error.name).toBe('LocationNotFoundError');
      expect(error.code).toBe('LOCATION_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('指定された場所が見つかりません');
      expect(error instanceof LocationNotFoundError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with custom message', () => {
      const customMessage = 'カスタムメッセージ';
      const error = new LocationNotFoundError(customMessage);
      
      expect(error.message).toBe(customMessage);
      expect(error.code).toBe('LOCATION_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('InvalidInputError', () => {
    it('should create error with default message', () => {
      const error = new InvalidInputError();
      
      expect(error.name).toBe('InvalidInputError');
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('入力形式が無効です');
      expect(error instanceof InvalidInputError).toBe(true);
    });

    it('should create error with custom message', () => {
      const customMessage = '緯度経度の形式が正しくありません';
      const error = new InvalidInputError(customMessage);
      
      expect(error.message).toBe(customMessage);
    });
  });

  describe('ExternalAPIError', () => {
    it('should create error with default message', () => {
      const error = new ExternalAPIError();
      
      expect(error.name).toBe('ExternalAPIError');
      expect(error.code).toBe('EXTERNAL_API_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.message).toBe('外部APIとの通信でエラーが発生しました');
      expect(error.apiName).toBeUndefined();
    });

    it('should create error with API name', () => {
      const apiName = 'GeocodeAPI';
      const error = new ExternalAPIError('API呼び出しエラー', apiName);
      
      expect(error.message).toBe('API呼び出しエラー');
      expect(error.apiName).toBe(apiName);
    });
  });

  describe('GeolocationError', () => {
    it('should create error with default message', () => {
      const error = new GeolocationError();
      
      expect(error.name).toBe('GeolocationError');
      expect(error.code).toBe('GEOLOCATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('位置情報の取得に失敗しました');
    });
  });

  describe('SuumoParsingError', () => {
    it('should create error with default message', () => {
      const error = new SuumoParsingError();
      
      expect(error.name).toBe('SuumoParsingError');
      expect(error.code).toBe('SUUMO_PARSING_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('SUUMO URLの解析に失敗しました');
    });
  });

  describe('CacheError', () => {
    it('should create error with default message', () => {
      const error = new CacheError();
      
      expect(error.name).toBe('CacheError');
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('キャッシュ操作でエラーが発生しました');
    });
  });

  describe('isCustomError', () => {
    it('should return true for custom errors', () => {
      expect(isCustomError(new LocationNotFoundError())).toBe(true);
      expect(isCustomError(new InvalidInputError())).toBe(true);
      expect(isCustomError(new ExternalAPIError())).toBe(true);
      expect(isCustomError(new GeolocationError())).toBe(true);
      expect(isCustomError(new SuumoParsingError())).toBe(true);
      expect(isCustomError(new CacheError())).toBe(true);
    });

    it('should return false for standard errors', () => {
      expect(isCustomError(new Error('standard error'))).toBe(false);
      expect(isCustomError(new TypeError('type error'))).toBe(false);
      expect(isCustomError(new ReferenceError('reference error'))).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isCustomError({})).toBe(false);
      expect(isCustomError('string')).toBe(false);
      expect(isCustomError(null)).toBe(false);
      expect(isCustomError(undefined)).toBe(false);
    });
  });
});