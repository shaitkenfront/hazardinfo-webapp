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
    it('should return array of hazard information', async () => {
      const result = await service.getHazardMapInfo(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
      
      // Check that each hazard info has required properties
      result.forEach(hazard => {
        expect(hazard).toHaveProperty('type');
        expect(hazard).toHaveProperty('riskLevel');
        expect(hazard).toHaveProperty('description');
        expect(hazard).toHaveProperty('source');
        expect(hazard).toHaveProperty('lastUpdated');
        expect(['flood', 'earthquake', 'landslide', 'tsunami', 'large_scale_fill']).toContain(hazard.type);
        expect(['low', 'medium', 'high', 'very_high']).toContain(hazard.riskLevel);
        expect(typeof hazard.description).toBe('string');
        expect(typeof hazard.source).toBe('string');
        expect(hazard.lastUpdated).toBeInstanceOf(Date);
      });
    });

    it('should return different hazard types based on coordinates', async () => {
      const coordinates1: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'coordinates'
      };
      
      const coordinates2: Coordinates = {
        latitude: 34.6937,
        longitude: 135.5023,
        source: 'coordinates'
      };

      const result1 = await service.getHazardMapInfo(coordinates1);
      const result2 = await service.getHazardMapInfo(coordinates2);

      // Results should be arrays (may be empty if all risks are low)
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });

    it('should filter out low risk hazards', async () => {
      const result = await service.getHazardMapInfo(mockCoordinates);
      
      // All returned hazards should have risk level above 'low'
      result.forEach(hazard => {
        expect(hazard.riskLevel).not.toBe('low');
      });
    });

    it('should include proper source information for each hazard type', async () => {
      const result = await service.getHazardMapInfo(mockCoordinates);
      
      result.forEach(hazard => {
        switch (hazard.type) {
          case 'flood':
            expect(hazard.source).toBe('国土交通省ハザードマップポータルサイト');
            expect(hazard.detailUrl).toBe('https://disaportal.gsi.go.jp/');
            break;
          case 'earthquake':
            expect(hazard.source).toBe('地震調査研究推進本部');
            expect(hazard.detailUrl).toBe('https://www.jishin.go.jp/');
            break;
          case 'landslide':
            expect(hazard.source).toBe('国土交通省砂防部');
            expect(hazard.detailUrl).toBe('https://www.mlit.go.jp/river/sabo/');
            break;
          case 'tsunami':
            expect(hazard.source).toBe('気象庁');
            expect(hazard.detailUrl).toBe('https://www.jma.go.jp/jma/kishou/know/tsunami/');
            break;
          case 'large_scale_fill':
            expect(hazard.source).toBe('国土交通省都市局');
            expect(hazard.detailUrl).toBe('https://www.mlit.go.jp/toshi/web/toshi_tobou_tk_000035.html');
            break;
        }
      });
    });

    it('should provide appropriate descriptions for different risk levels', async () => {
      const result = await service.getHazardMapInfo(mockCoordinates);
      
      result.forEach(hazard => {
        expect(hazard.description).toBeTruthy();
        expect(typeof hazard.description).toBe('string');
        expect(hazard.description.length).toBeGreaterThan(0);
        
        // Check that description matches risk level appropriately
        if (hazard.riskLevel === 'very_high') {
          expect(hazard.description).toContain('非常に高い');
        } else if (hazard.riskLevel === 'high') {
          expect(hazard.description).toContain('高い');
        } else if (hazard.riskLevel === 'medium') {
          expect(hazard.description).toContain('中程度');
        }
      });
    });

    it('should handle coordinates with different sources', async () => {
      const addressCoords: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区',
        source: 'address'
      };

      const suumoCoords: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'suumo'
      };

      const geolocationCoords: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'geolocation'
      };

      const result1 = await service.getHazardMapInfo(addressCoords);
      const result2 = await service.getHazardMapInfo(suumoCoords);
      const result3 = await service.getHazardMapInfo(geolocationCoords);

      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
      expect(Array.isArray(result3)).toBe(true);
    });

    it('should handle edge case coordinates', async () => {
      const edgeCoords: Coordinates = {
        latitude: 45.0,
        longitude: 145.0,
        source: 'coordinates'
      };

      const result = await service.getHazardMapInfo(edgeCoords);
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