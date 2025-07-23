import { LocationService, LocationNotFoundError, InvalidInputError, GeolocationError } from '../LocationService';

// Fetch APIのモック
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('LocationService', () => {
  let locationService: LocationService;
  const originalEnv = process.env;

  beforeEach(() => {
    locationService = new LocationService();
    // 環境変数をリセット
    process.env = { ...originalEnv };
    process.env.GOOGLE_API_KEY = 'test-api-key';
    // fetchモックをリセット
    mockFetch.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('resolveAddress', () => {
    it('should resolve valid address using Google Maps API', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{
          formatted_address: '日本、〒100-0001 東京都千代田区千代田',
          geometry: {
            location: {
              lat: 35.6812,
              lng: 139.7671
            }
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await locationService.resolveAddress('東京都千代田区');
      
      expect(result).toEqual({
        latitude: 35.6812,
        longitude: 139.7671,
        address: '東京都千代田区',
        source: 'address'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/geocode/json?address=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8D%83%E4%BB%A3%E7%94%B0%E5%8C%BA&key=test-api-key&region=jp'
      );
    });

    it('should throw InvalidInputError for empty address', async () => {
      await expect(locationService.resolveAddress('')).rejects.toThrow(InvalidInputError);
      await expect(locationService.resolveAddress('   ')).rejects.toThrow(InvalidInputError);
    });

    it('should throw LocationNotFoundError when API returns ZERO_RESULTS', async () => {
      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await expect(locationService.resolveAddress('存在しない住所')).rejects.toThrow(LocationNotFoundError);
    });

    it('should throw error when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY;

      await expect(locationService.resolveAddress('東京都千代田区')).rejects.toThrow('GOOGLE_API_KEY環境変数が設定されていません');
    });

    it('should throw error when API returns error status', async () => {
      const mockResponse = {
        status: 'REQUEST_DENIED',
        error_message: 'API key not valid'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await expect(locationService.resolveAddress('東京都千代田区')).rejects.toThrow('Geocoding API error: REQUEST_DENIED - API key not valid');
    });

    it('should throw error when HTTP request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403
      } as Response);

      await expect(locationService.resolveAddress('東京都千代田区')).rejects.toThrow('HTTP error! status: 403');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(locationService.resolveAddress('東京都千代田区')).rejects.toThrow('Geocoding APIの呼び出しに失敗しました: Network error');
    });
  });

  describe('parseCoordinates', () => {
    it('should parse valid coordinates', async () => {
      const result = await locationService.parseCoordinates('35.6895', '139.6917');
      
      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        source: 'coordinates'
      });
    });

    it('should throw InvalidInputError for empty coordinates', async () => {
      await expect(locationService.parseCoordinates('', '139.6917')).rejects.toThrow(InvalidInputError);
      await expect(locationService.parseCoordinates('35.6895', '')).rejects.toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for non-numeric coordinates', async () => {
      await expect(locationService.parseCoordinates('abc', '139.6917')).rejects.toThrow(InvalidInputError);
      await expect(locationService.parseCoordinates('35.6895', 'xyz')).rejects.toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for coordinates outside Japan', async () => {
      // 緯度が範囲外
      await expect(locationService.parseCoordinates('10', '139.6917')).rejects.toThrow(InvalidInputError);
      await expect(locationService.parseCoordinates('50', '139.6917')).rejects.toThrow(InvalidInputError);
      
      // 経度が範囲外
      await expect(locationService.parseCoordinates('35.6895', '100')).rejects.toThrow(InvalidInputError);
      await expect(locationService.parseCoordinates('35.6895', '160')).rejects.toThrow(InvalidInputError);
    });

    it('should accept coordinates within Japan range', async () => {
      // 日本の境界付近の座標
      await expect(locationService.parseCoordinates('20.5', '123')).resolves.toBeDefined();
      await expect(locationService.parseCoordinates('45.5', '153')).resolves.toBeDefined();
    });
  });


  describe('getCurrentLocation', () => {
    it('should throw GeolocationError as this is frontend functionality', async () => {
      await expect(locationService.getCurrentLocation()).rejects.toThrow(GeolocationError);
    });
  });

  describe('processGeolocationCoordinates', () => {
    it('should process valid geolocation coordinates', async () => {
      const result = await locationService.processGeolocationCoordinates(35.6895, 139.6917);
      
      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        source: 'geolocation'
      });
    });

    it('should throw InvalidInputError for NaN coordinates', async () => {
      await expect(locationService.processGeolocationCoordinates(NaN, 139.6917)).rejects.toThrow(InvalidInputError);
      await expect(locationService.processGeolocationCoordinates(35.6895, NaN)).rejects.toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for coordinates outside Japan', async () => {
      // 緯度が範囲外
      await expect(locationService.processGeolocationCoordinates(10, 139.6917)).rejects.toThrow(InvalidInputError);
      await expect(locationService.processGeolocationCoordinates(50, 139.6917)).rejects.toThrow(InvalidInputError);
      
      // 経度が範囲外
      await expect(locationService.processGeolocationCoordinates(35.6895, 100)).rejects.toThrow(InvalidInputError);
      await expect(locationService.processGeolocationCoordinates(35.6895, 160)).rejects.toThrow(InvalidInputError);
    });

    it('should accept coordinates within Japan range', async () => {
      // 日本の境界付近の座標
      await expect(locationService.processGeolocationCoordinates(20.5, 123)).resolves.toBeDefined();
      await expect(locationService.processGeolocationCoordinates(45.5, 153)).resolves.toBeDefined();
    });
  });

  describe('Error classes', () => {
    it('should create LocationNotFoundError with correct name', () => {
      const error = new LocationNotFoundError('test message');
      expect(error.name).toBe('LocationNotFoundError');
      expect(error.message).toBe('test message');
    });

    it('should create InvalidInputError with correct name', () => {
      const error = new InvalidInputError('test message');
      expect(error.name).toBe('InvalidInputError');
      expect(error.message).toBe('test message');
    });


    it('should create GeolocationError with correct name', () => {
      const error = new GeolocationError('test message');
      expect(error.name).toBe('GeolocationError');
      expect(error.message).toBe('test message');
    });
  });
});