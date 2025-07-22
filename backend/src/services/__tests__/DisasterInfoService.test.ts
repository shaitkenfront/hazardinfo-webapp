import { DisasterInfoService, ExternalAPIError } from '../DisasterInfoService';
import { Coordinates } from '../../types';

describe('DisasterInfoService', () => {
  let service: DisasterInfoService;
  let mockCoordinates: Coordinates;

  beforeEach(() => {
    service = new DisasterInfoService();
    mockCoordinates = {
      latitude: 35.6762,
      longitude: 139.6503,
      address: '東京都',
      source: 'address'
    };
  });

  describe('constructor', () => {
    it('should create an instance with HTTP client', () => {
      expect(service).toBeInstanceOf(DisasterInfoService);
      expect(service.getHttpClient()).toBeDefined();
    });

    it('should configure HTTP client with proper defaults', () => {
      const httpClient = service.getHttpClient();
      expect(httpClient.defaults.timeout).toBe(10000);
      expect(httpClient.defaults.headers['User-Agent']).toBe('DisasterInfoApp/1.0');
      expect(httpClient.defaults.headers['Accept']).toBe('application/json');
    });
  });

  describe('getHazardMapInfo', () => {
    it('should return empty array for basic implementation', async () => {
      const result = await service.getHazardMapInfo(mockCoordinates);
      expect(result).toEqual([]);
    });

    it('should handle errors and wrap them in ExternalAPIError', async () => {
      // This test will be expanded when actual API calls are implemented
      const result = await service.getHazardMapInfo(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getEvacuationShelters', () => {
    it('should return empty array for basic implementation', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      expect(result).toEqual([]);
    });

    it('should handle errors and wrap them in ExternalAPIError', async () => {
      // This test will be expanded when actual API calls are implemented
      const result = await service.getEvacuationShelters(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getDisasterHistory', () => {
    it('should return empty array for basic implementation', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      expect(result).toEqual([]);
    });

    it('should handle errors and wrap them in ExternalAPIError', async () => {
      // This test will be expanded when actual API calls are implemented
      const result = await service.getDisasterHistory(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getWeatherAlerts', () => {
    it('should return empty array for basic implementation', async () => {
      const result = await service.getWeatherAlerts(mockCoordinates);
      expect(result).toEqual([]);
    });

    it('should handle errors and wrap them in ExternalAPIError', async () => {
      // This test will be expanded when actual API calls are implemented
      const result = await service.getWeatherAlerts(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('ExternalAPIError', () => {
  it('should create error with message only', () => {
    const error = new ExternalAPIError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ExternalAPIError');
    expect(error.statusCode).toBeUndefined();
    expect(error.apiName).toBeUndefined();
  });

  it('should create error with all parameters', () => {
    const error = new ExternalAPIError('Test error', 404, 'test-api');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ExternalAPIError');
    expect(error.statusCode).toBe(404);
    expect(error.apiName).toBe('test-api');
  });

  it('should be instance of Error', () => {
    const error = new ExternalAPIError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ExternalAPIError);
  });
});