import {
  ValidationError,
  validateCoordinates,
  validateHazardInfo,
  validateShelter,
  validateDisasterEvent,
  validateWeatherAlert
} from '../validation';

describe('Data Model Validation', () => {
  describe('validateCoordinates', () => {
    it('should validate valid coordinates', () => {
      const validData = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都',
        source: 'address' as const
      };

      const result = validateCoordinates(validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid latitude', () => {
      const invalidData = {
        latitude: 91,
        longitude: 139.6503,
        source: 'coordinates' as const
      };

      expect(() => validateCoordinates(invalidData)).toThrow(ValidationError);
      expect(() => validateCoordinates(invalidData)).toThrow('Latitude must be between -90 and 90');
    });

    it('should throw error for invalid longitude', () => {
      const invalidData = {
        latitude: 35.6762,
        longitude: 181,
        source: 'coordinates' as const
      };

      expect(() => validateCoordinates(invalidData)).toThrow(ValidationError);
      expect(() => validateCoordinates(invalidData)).toThrow('Longitude must be between -180 and 180');
    });

    it('should throw error for coordinates outside Japan', () => {
      const invalidData = {
        latitude: 40.7128, // New York
        longitude: -74.0060,
        source: 'coordinates' as const
      };

      expect(() => validateCoordinates(invalidData)).toThrow(ValidationError);
      expect(() => validateCoordinates(invalidData)).toThrow('Coordinates must be within Japan');
    });

    it('should throw error for invalid source', () => {
      const invalidData = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'invalid' as any
      };

      expect(() => validateCoordinates(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateHazardInfo', () => {
    it('should validate valid hazard info', () => {
      const validData = {
        type: 'flood' as const,
        riskLevel: 'high' as const,
        description: '洪水リスクが高い地域です',
        source: '国土交通省',
        lastUpdated: '2024-01-01T00:00:00Z',
        detailUrl: 'https://example.com'
      };

      const result = validateHazardInfo(validData);
      expect(result.type).toBe('flood');
      expect(result.riskLevel).toBe('high');
      expect(result.description).toBe('洪水リスクが高い地域です');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should throw error for invalid type', () => {
      const invalidData = {
        type: 'invalid',
        riskLevel: 'high' as const,
        description: 'test',
        source: 'test',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      expect(() => validateHazardInfo(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for invalid risk level', () => {
      const invalidData = {
        type: 'flood' as const,
        riskLevel: 'invalid',
        description: 'test',
        source: 'test',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      expect(() => validateHazardInfo(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for invalid detail URL', () => {
      const invalidData = {
        type: 'flood' as const,
        riskLevel: 'high' as const,
        description: 'test',
        source: 'test',
        lastUpdated: '2024-01-01T00:00:00Z',
        detailUrl: 'invalid-url'
      };

      expect(() => validateHazardInfo(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateShelter', () => {
    it('should validate valid shelter info', () => {
      const validData = {
        name: '東京都庁',
        address: '東京都新宿区西新宿2-8-1',
        coordinates: {
          latitude: 35.6896,
          longitude: 139.6917,
          source: 'address' as const
        },
        capacity: 1000,
        facilities: ['トイレ', '給水設備'],
        distance: 500
      };

      const result = validateShelter(validData);
      expect(result.name).toBe('東京都庁');
      expect(result.capacity).toBe(1000);
      expect(result.facilities).toEqual(['トイレ', '給水設備']);
    });

    it('should throw error for negative capacity', () => {
      const invalidData = {
        name: 'test',
        address: 'test',
        coordinates: {
          latitude: 35.6896,
          longitude: 139.6917,
          source: 'address' as const
        },
        capacity: -1,
        facilities: [],
        distance: 100
      };

      expect(() => validateShelter(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for invalid facilities array', () => {
      const invalidData = {
        name: 'test',
        address: 'test',
        coordinates: {
          latitude: 35.6896,
          longitude: 139.6917,
          source: 'address' as const
        },
        capacity: 100,
        facilities: ['valid', ''],
        distance: 100
      };

      expect(() => validateShelter(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateDisasterEvent', () => {
    it('should validate valid disaster event', () => {
      const validData = {
        type: '地震',
        date: '2024-01-01T00:00:00Z',
        description: 'マグニチュード7.0の地震が発生',
        severity: '強',
        source: '気象庁'
      };

      const result = validateDisasterEvent(validData);
      expect(result.type).toBe('地震');
      expect(result.date).toBeInstanceOf(Date);
      expect(result.severity).toBe('強');
    });

    it('should throw error for invalid date', () => {
      const invalidData = {
        type: '地震',
        date: 'invalid-date',
        description: 'test',
        severity: 'test',
        source: 'test'
      };

      expect(() => validateDisasterEvent(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateWeatherAlert', () => {
    it('should validate valid weather alert', () => {
      const validData = {
        type: '大雨警報',
        level: 'warning' as const,
        description: '大雨による土砂災害に警戒',
        issuedAt: '2024-01-01T00:00:00Z',
        validUntil: '2024-01-02T00:00:00Z',
        area: '東京都'
      };

      const result = validateWeatherAlert(validData);
      expect(result.type).toBe('大雨警報');
      expect(result.level).toBe('warning');
      expect(result.issuedAt).toBeInstanceOf(Date);
      expect(result.validUntil).toBeInstanceOf(Date);
    });

    it('should throw error for invalid level', () => {
      const invalidData = {
        type: 'test',
        level: 'invalid',
        description: 'test',
        issuedAt: '2024-01-01T00:00:00Z',
        area: 'test'
      };

      expect(() => validateWeatherAlert(invalidData)).toThrow(ValidationError);
    });

    it('should throw error when validUntil is before issuedAt', () => {
      const invalidData = {
        type: 'test',
        level: 'warning' as const,
        description: 'test',
        issuedAt: '2024-01-02T00:00:00Z',
        validUntil: '2024-01-01T00:00:00Z',
        area: 'test'
      };

      expect(() => validateWeatherAlert(invalidData)).toThrow(ValidationError);
    });
  });
});