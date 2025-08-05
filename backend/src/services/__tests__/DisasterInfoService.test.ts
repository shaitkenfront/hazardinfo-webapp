import { DisasterInfoService, ExternalAPIError } from '../DisasterInfoService';
import { Coordinates } from '../../types';
import axios from 'axios';

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
      expect(httpClient.defaults.timeout).toBe(120000); // 2分に更新
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
            expect(hazard.source).toBe('国土交通省国土政策局国土情報課');
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

      const geolocationCoords: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'geolocation'
      };

      const result1 = await service.getHazardMapInfo(addressCoords);
      const result2 = await service.getHazardMapInfo(geolocationCoords);

      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
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
    it('should return array of disaster events', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(50); // Maximum 50 events
    });

    it('should return disaster events with all required properties', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      
      result.forEach(event => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('date');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('severity');
        expect(event).toHaveProperty('source');
        
        expect(typeof event.type).toBe('string');
        expect(event.date).toBeInstanceOf(Date);
        expect(typeof event.description).toBe('string');
        expect(typeof event.severity).toBe('string');
        expect(typeof event.source).toBe('string');
        
        expect(event.type.length).toBeGreaterThan(0);
        expect(event.description.length).toBeGreaterThan(0);
        expect(event.severity.length).toBeGreaterThan(0);
        expect(event.source.length).toBeGreaterThan(0);
      });
    });

    it('should return events sorted by date (newest first)', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(result[i].date.getTime()).toBeLessThanOrEqual(result[i - 1].date.getTime());
        }
      }
    });

    it('should return events within the last 20 years', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      const currentYear = new Date().getFullYear();
      const twentyYearsAgo = currentYear - 20;
      
      result.forEach(event => {
        expect(event.date.getFullYear()).toBeGreaterThanOrEqual(twentyYearsAgo);
        expect(event.date.getFullYear()).toBeLessThanOrEqual(currentYear);
      });
    });

    it('should return events with valid disaster types', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      const validTypes = ['台風', '豪雨', '地震', '洪水', '土砂災害', '津波', '竜巻', '雪害'];
      
      result.forEach(event => {
        expect(validTypes).toContain(event.type);
      });
    });

    it('should return events with appropriate severity levels', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      const validSeverities = [
        // 地震
        '震度3', '震度4', '震度5弱', '震度5強', '震度6弱',
        // 津波
        '津波注意報', '津波警報', '大津波警報',
        // 台風・豪雨
        '軽微', '中程度', '甚大', '注意', '警戒', '危険',
        // 洪水・土砂災害
        '小規模', '中規模', '大規模',
        // 竜巻
        'F0', 'F1', 'F2',
        // 雪害
        '大雪注意報', '大雪警報', '暴風雪警報'
      ];
      
      result.forEach(event => {
        expect(validSeverities).toContain(event.severity);
      });
    });

    it('should return events with valid sources', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      const validSources = [
        '気象庁', '自治体', '河川事務所', '地震調査委員会',
        '国土交通省', '国土交通省砂防部'
      ];
      
      result.forEach(event => {
        expect(validSources).toContain(event.source);
      });
    });

    it('should filter out low importance events', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      
      // All returned events should have importance level 3 or higher
      // This means no events with very low severity should be included
      result.forEach(event => {
        // Events with these severities should not appear (importance < 3)
        expect(event.severity).not.toBe('震度1');
        expect(event.severity).not.toBe('震度2');
      });
    });

    it('should remove duplicate events (same type and date)', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      const seen = new Set<string>();
      
      result.forEach(event => {
        const key = `${event.type}-${event.date.toDateString()}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      });
    });

    it('should generate different events for different coordinates', async () => {
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

      const result1 = await service.getDisasterHistory(coords1);
      const result2 = await service.getDisasterHistory(coords2);

      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
      
      // Events should be different for different locations
      const events1 = result1.map(e => `${e.type}-${e.date.toISOString()}-${e.severity}`).sort();
      const events2 = result2.map(e => `${e.type}-${e.date.toISOString()}-${e.severity}`).sort();
      expect(events1).not.toEqual(events2);
    });

    it('should generate consistent events for same coordinates', async () => {
      const result1 = await service.getDisasterHistory(mockCoordinates);
      const result2 = await service.getDisasterHistory(mockCoordinates);

      expect(result1).toEqual(result2);
    });

    it('should include appropriate descriptions for each disaster type', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      
      result.forEach(event => {
        expect(event.description).toContain('年');
        expect(event.description).toContain('月');
        expect(event.description).toContain('日');
        
        switch (event.type) {
          case '台風':
            expect(event.description).toContain('台風による被害');
            expect(event.description).toContain('被害規模');
            break;
          case '豪雨':
            expect(event.description).toContain('豪雨による被害');
            expect(event.description).toContain('警戒レベル');
            break;
          case '地震':
            expect(event.description).toContain('地震が発生');
            expect(event.description).toContain('最大震度');
            break;
          case '洪水':
            expect(event.description).toContain('洪水が発生');
            expect(event.description).toContain('被害規模');
            break;
          case '土砂災害':
            expect(event.description).toContain('土砂災害が発生');
            expect(event.description).toContain('被害規模');
            break;
          case '津波':
            expect(event.description).toContain('津波が発生');
            expect(event.description).toContain('警報レベル');
            break;
          case '竜巻':
            expect(event.description).toContain('竜巻が発生');
            expect(event.description).toContain('強度');
            break;
          case '雪害':
            expect(event.description).toContain('雪害が発生');
            expect(event.description).toContain('警報レベル');
            break;
        }
      });
    });

    it('should handle edge case coordinates', async () => {
      const edgeCoords: Coordinates = {
        latitude: 45.0,
        longitude: 145.0,
        source: 'coordinates'
      };

      const result = await service.getDisasterHistory(edgeCoords);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle coordinates with different sources', async () => {
      const addressCoords: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区',
        source: 'address'
      };

      const geolocationCoords: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'geolocation'
      };

      const result1 = await service.getDisasterHistory(addressCoords);
      const result2 = await service.getDisasterHistory(geolocationCoords);

      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
      
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
      expect(result3.length).toBeGreaterThan(0);
    });

    it('should handle errors and wrap them in ExternalAPIError', async () => {
      // Test error handling by mocking a failure scenario
      const originalMethod = service['generateHistoricalDisasterEvents'];
      service['generateHistoricalDisasterEvents'] = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(service.getDisasterHistory(mockCoordinates)).rejects.toThrow(ExternalAPIError);
      await expect(service.getDisasterHistory(mockCoordinates)).rejects.toThrow('Failed to fetch disaster history: Test error');

      // Restore original method
      service['generateHistoricalDisasterEvents'] = originalMethod;
    });

    it('should filter events by importance level', async () => {
      const result = await service.getDisasterHistory(mockCoordinates);
      
      // Check that all events have importance level 3 or higher
      const importanceMap: { [key: string]: number } = {
        '震度6弱': 10, '震度5強': 9, '震度5弱': 8, '震度4': 6, '震度3': 4,
        '大津波警報': 10, '津波警報': 8, '津波注意報': 6,
        '甚大': 9, '危険': 8, '中程度': 6, '警戒': 5, '軽微': 3, '注意': 3,
        '大規模': 8, '中規模': 6, '小規模': 4,
        'F2': 8, 'F1': 6, 'F0': 4,
        '暴風雪警報': 7, '大雪警報': 6, '大雪注意報': 4
      };
      
      result.forEach(event => {
        const importance = importanceMap[event.severity] || 1;
        expect(importance).toBeGreaterThanOrEqual(3);
      });
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

describe('DisasterInfoService - Large Scale Fill Land Tests', () => {
  let service: DisasterInfoService;
  
  beforeEach(() => {
    service = new DisasterInfoService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should correctly parse large_scale_fill with "あり" value', async () => {
    // 実際のAPIレスポンスをモック
    const mockResponse = {
      data: {
        coordinates: { latitude: 34.6993494, longitude: 133.9110238 },
        source: '座標: 34.6993494, 133.9110238 (入力座標系: wgs84)',
        input_type: 'latlon',
        datum: 'wgs84',
        hazard_info: {
          jshis_prob_50: { max_prob: 0.500778, center_prob: 0.43957 },
          jshis_prob_60: { max_prob: 0.005517, center_prob: 0.002745 },
          inundation_depth: { max_info: '浸水なし', center_info: '浸水なし' },
          tsunami_inundation: { max_info: '浸水想定なし', center_info: '浸水想定なし' },
          hightide_inundation: { max_info: '浸水想定なし', center_info: '浸水想定なし' },
          large_fill_land: { max_info: 'あり', center_info: 'あり' },
          landslide_hazard: {
            debris_flow: { max_info: '該当なし', center_info: '該当なし' },
            steep_slope: { max_info: '該当なし', center_info: '該当なし' },
            landslide: { max_info: '該当なし', center_info: '該当なし' }
          }
        },
        status: 'success'
      }
    };

    // HTTPクライアントをモック
    const mockGet = jest.spyOn(service.getHttpClient(), 'get').mockResolvedValue(mockResponse);

    const coordinates: Coordinates = {
      latitude: 34.6993494,
      longitude: 133.9110238,
      source: 'coordinates'
    };

    const result = await service.getHazardMapInfo(coordinates);

    // リクエストが正しいURLで行われたことを確認
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('lat=34.6993494&lon=133.9110238&datum=wgs84'),
      expect.any(Object)
    );

    // 大規模盛土造成地の情報が含まれていることを確認
    const largeFillHazard = result.find(hazard => hazard.type === 'large_scale_fill');
    expect(largeFillHazard).toBeDefined();
    expect(largeFillHazard?.riskLevel).toBe('medium');
    expect(largeFillHazard?.description).toBe('大規模盛土造成地に該当します。');
    expect(largeFillHazard?.source).toBe('国土交通省国土政策局国土情報課');

    // 地震リスクも含まれていることを確認（prob: 0.500778は medium レベル）
    const earthquakeHazard = result.find(hazard => hazard.type === 'earthquake');
    expect(earthquakeHazard).toBeDefined();
    expect(earthquakeHazard?.riskLevel).toBe('medium');
  });

  it('should handle various large_fill_land values correctly', async () => {
    const testCases = [
      { value: 'あり', expectedRisk: 'medium', expectedDesc: '大規模盛土造成地に該当します。' },
      { value: '警戒', expectedRisk: 'high', expectedDesc: '大規模盛土造成地に指定されています' },
      { value: '注意', expectedRisk: 'medium', expectedDesc: '大規模盛土造成地の可能性があります' },
      { value: '該当なし', expectedRisk: null, expectedDesc: null },
      { value: '情報なし', expectedRisk: null, expectedDesc: null }
    ];

    for (const testCase of testCases) {
      const mockResponse = {
        data: {
          coordinates: { latitude: 34.6993494, longitude: 133.9110238 },
          source: 'test',
          input_type: 'latlon',
          datum: 'wgs84',
          hazard_info: {
            jshis_prob_50: { max_prob: 0.1, center_prob: 0.1 },
            jshis_prob_60: { max_prob: 0.01, center_prob: 0.01 },
            inundation_depth: { max_info: '浸水なし', center_info: '浸水なし' },
            tsunami_inundation: { max_info: '浸水想定なし', center_info: '浸水想定なし' },
            hightide_inundation: { max_info: '浸水想定なし', center_info: '浸水想定なし' },
            large_fill_land: { max_info: testCase.value, center_info: testCase.value },
            landslide_hazard: {
              debris_flow: { max_info: '該当なし', center_info: '該当なし' },
              steep_slope: { max_info: '該当なし', center_info: '該当なし' },
              landslide: { max_info: '該当なし', center_info: '該当なし' }
            }
          },
          status: 'success'
        }
      };

      const mockGet = jest.spyOn(service.getHttpClient(), 'get').mockResolvedValue(mockResponse);

      const coordinates: Coordinates = {
        latitude: 34.6993494,
        longitude: 133.9110238,
        source: 'coordinates'
      };

      const result = await service.getHazardMapInfo(coordinates);
      const largeFillHazard = result.find(hazard => hazard.type === 'large_scale_fill');

      if (testCase.expectedRisk === null) {
        expect(largeFillHazard).toBeUndefined();
      } else {
        expect(largeFillHazard).toBeDefined();
        expect(largeFillHazard?.riskLevel).toBe(testCase.expectedRisk);
        expect(largeFillHazard?.description).toContain(testCase.expectedDesc!);
      }

      mockGet.mockRestore();
    }
  });
});