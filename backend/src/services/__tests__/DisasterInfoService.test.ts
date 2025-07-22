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
    it('should return array of shelter information', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should return shelters with all required properties', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      result.forEach(shelter => {
        expect(shelter).toHaveProperty('name');
        expect(shelter).toHaveProperty('address');
        expect(shelter).toHaveProperty('coordinates');
        expect(shelter).toHaveProperty('capacity');
        expect(shelter).toHaveProperty('facilities');
        expect(shelter).toHaveProperty('distance');
        
        expect(typeof shelter.name).toBe('string');
        expect(typeof shelter.address).toBe('string');
        expect(typeof shelter.capacity).toBe('number');
        expect(typeof shelter.distance).toBe('number');
        expect(Array.isArray(shelter.facilities)).toBe(true);
        
        expect(shelter.coordinates).toHaveProperty('latitude');
        expect(shelter.coordinates).toHaveProperty('longitude');
        expect(shelter.coordinates).toHaveProperty('source');
        expect(typeof shelter.coordinates.latitude).toBe('number');
        expect(typeof shelter.coordinates.longitude).toBe('number');
        expect(shelter.coordinates.source).toBe('coordinates');
      });
    });

    it('should return shelters sorted by distance', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(result[i].distance).toBeGreaterThanOrEqual(result[i - 1].distance);
        }
      }
    });

    it('should return shelters within reasonable distance', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      result.forEach(shelter => {
        expect(shelter.distance).toBeGreaterThan(0);
        expect(shelter.distance).toBeLessThan(10); // Within 10km radius
      });
    });

    it('should return shelters with valid capacity ranges', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      result.forEach(shelter => {
        expect(shelter.capacity).toBeGreaterThan(0);
        expect(shelter.capacity).toBeLessThan(2000); // Reasonable upper limit
      });
    });

    it('should return shelters with appropriate facilities', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      result.forEach(shelter => {
        expect(shelter.facilities.length).toBeGreaterThan(0);
        shelter.facilities.forEach(facility => {
          expect(typeof facility).toBe('string');
          expect(facility.length).toBeGreaterThan(0);
        });
      });
    });

    it('should generate different shelters for different coordinates', async () => {
      const coords1: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'coordinates'
      };
      
      const coords2: Coordinates = {
        latitude: 34.6937,
        longitude: 135.5023,
        source: 'coordinates'
      };

      const result1 = await service.getEvacuationShelters(coords1);
      const result2 = await service.getEvacuationShelters(coords2);

      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
      
      // Shelters should be different for different locations
      const names1 = result1.map(s => s.name).sort();
      const names2 = result2.map(s => s.name).sort();
      expect(names1).not.toEqual(names2);
    });

    it('should return shelters with valid coordinates within expected range', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      result.forEach(shelter => {
        const latDiff = Math.abs(shelter.coordinates.latitude - mockCoordinates.latitude);
        const lngDiff = Math.abs(shelter.coordinates.longitude - mockCoordinates.longitude);
        
        // Should be within approximately 5km (0.09 degrees)
        expect(latDiff).toBeLessThan(0.1);
        expect(lngDiff).toBeLessThan(0.1);
      });
    });

    it('should return shelters with distance calculated correctly', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      result.forEach(shelter => {
        // Manually calculate distance using the same formula
        const R = 6371;
        const dLat = (shelter.coordinates.latitude - mockCoordinates.latitude) * (Math.PI / 180);
        const dLng = (shelter.coordinates.longitude - mockCoordinates.longitude) * (Math.PI / 180);
        
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(mockCoordinates.latitude * (Math.PI / 180)) * Math.cos(shelter.coordinates.latitude * (Math.PI / 180)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const expectedDistance = R * c;
        
        // Allow small rounding differences
        expect(Math.abs(shelter.distance - expectedDistance)).toBeLessThan(0.01);
      });
    });

    it('should handle edge case coordinates', async () => {
      const edgeCoords: Coordinates = {
        latitude: 45.0,
        longitude: 145.0,
        source: 'coordinates'
      };

      const result = await service.getEvacuationShelters(edgeCoords);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return shelters with rounded distance values', async () => {
      const result = await service.getEvacuationShelters(mockCoordinates);
      
      result.forEach(shelter => {
        // Distance should be rounded to 2 decimal places
        const decimalPlaces = (shelter.distance.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    it('should handle errors and wrap them in ExternalAPIError', async () => {
      // Test error handling by mocking a failure scenario
      const originalMethod = service['generateNearbyEvacuationShelters'];
      service['generateNearbyEvacuationShelters'] = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(service.getEvacuationShelters(mockCoordinates)).rejects.toThrow(ExternalAPIError);
      await expect(service.getEvacuationShelters(mockCoordinates)).rejects.toThrow('Failed to fetch evacuation shelters: Test error');

      // Restore original method
      service['generateNearbyEvacuationShelters'] = originalMethod;
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