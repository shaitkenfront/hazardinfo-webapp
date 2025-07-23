import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  createValidationError,
  createExternalAPIError
} from '../ErrorHandler';
import {
  LocationNotFoundError,
  InvalidInputError,
  ExternalAPIError,
  GeolocationError
} from '../CustomErrors';

// Mock Express objects
const mockRequest = () => ({
  url: '/test',
  method: 'GET'
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle LocationNotFoundError correctly', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new LocationNotFoundError('場所が見つかりません');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: '場所が見つかりません',
          statusCode: 404,
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle InvalidInputError correctly', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new InvalidInputError('無効な入力です');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_INPUT',
          message: '無効な入力です',
          statusCode: 400,
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle ExternalAPIError with API name', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new ExternalAPIError('API呼び出しエラー', 'TestAPI');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'API呼び出しエラー',
          statusCode: 502,
          apiName: 'TestAPI',
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle GeolocationError correctly', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new GeolocationError('位置情報エラー');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'GEOLOCATION_ERROR',
          message: '位置情報エラー',
          statusCode: 400,
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle unexpected errors', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new Error('予期しないエラー');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '内部サーバーエラーが発生しました',
          statusCode: 500,
          timestamp: expect.any(String)
        }
      });
    });

    it('should log error details', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new Error('テストエラー');

      errorHandler(error, req, res, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error occurred:', {
        name: 'Error',
        message: 'テストエラー',
        stack: expect.any(String),
        url: '/test',
        method: 'GET',
        timestamp: expect.any(String)
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const mockAsyncFn = jest.fn().mockResolvedValue('success');

      const wrappedHandler = asyncHandler(mockAsyncFn);
      await wrappedHandler(req, res, mockNext);

      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new Error('非同期エラー');
      const mockAsyncFn = jest.fn().mockRejectedValue(error);

      const wrappedHandler = asyncHandler(mockAsyncFn);
      await wrappedHandler(req, res, mockNext);

      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 error response', () => {
      const req = mockRequest();
      const res = mockResponse();

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'リクエストされたリソースが見つかりません',
          statusCode: 404,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('createValidationError', () => {
    it('should create InvalidInputError with detailed message', () => {
      const error = createValidationError('latitude', '無効な値', 'number');

      expect(error).toBeInstanceOf(InvalidInputError);
      expect(error.message).toBe('latitudeの形式が無効です。期待される形式: number。入力値: 無効な値');
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('createExternalAPIError', () => {
    it('should create ExternalAPIError with API name', () => {
      const error = createExternalAPIError('GeocodeAPI');

      expect(error).toBeInstanceOf(ExternalAPIError);
      expect(error.message).toBe('GeocodeAPI APIでエラーが発生しました');
      expect(error.apiName).toBe('GeocodeAPI');
      expect(error.code).toBe('EXTERNAL_API_ERROR');
      expect(error.statusCode).toBe(502);
    });

    it('should create ExternalAPIError with original error message', () => {
      const originalError = new Error('接続タイムアウト');
      const error = createExternalAPIError('WeatherAPI', originalError);

      expect(error).toBeInstanceOf(ExternalAPIError);
      expect(error.message).toBe('WeatherAPI APIでエラーが発生しました: 接続タイムアウト');
      expect(error.apiName).toBe('WeatherAPI');
    });
  });
});