import { LocationService, LocationNotFoundError, InvalidInputError, SuumoParsingError, GeolocationError } from '../LocationService';

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = new LocationService();
  });

  describe('resolveAddress', () => {
    it('should resolve valid Tokyo address', async () => {
      const result = await locationService.resolveAddress('東京都千代田区');
      
      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        address: '東京都千代田区',
        source: 'address'
      });
    });

    it('should resolve valid Osaka address', async () => {
      const result = await locationService.resolveAddress('大阪府大阪市');
      
      expect(result).toEqual({
        latitude: 34.6937,
        longitude: 135.5023,
        address: '大阪府大阪市',
        source: 'address'
      });
    });

    it('should throw InvalidInputError for empty address', async () => {
      await expect(locationService.resolveAddress('')).rejects.toThrow(InvalidInputError);
      await expect(locationService.resolveAddress('   ')).rejects.toThrow(InvalidInputError);
    });

    it('should throw LocationNotFoundError for unknown address', async () => {
      await expect(locationService.resolveAddress('存在しない住所')).rejects.toThrow(LocationNotFoundError);
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

  describe('extractLocationFromSuumo', () => {
    it('should extract location from valid SUUMO chintai URL with tokyo', async () => {
      const url = 'https://suumo.jp/chintai/tokyo/jnc_000012345.html';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO chintai URL with area code 13', async () => {
      const url = 'https://suumo.jp/chintai/13/jnc_000012345.html';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO chintai URL with osaka', async () => {
      const url = 'https://suumo.jp/chintai/osaka/jnc_000012345.html';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 34.6937,
        longitude: 135.5023,
        address: '大阪府大阪市',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO chintai URL with kanagawa', async () => {
      const url = 'https://suumo.jp/chintai/kanagawa/jnc_000012345.html';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.4478,
        longitude: 139.6425,
        address: '神奈川県横浜市',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO chintai URL with default location', async () => {
      const url = 'https://suumo.jp/chintai/jnc_000012345.html';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.6812,
        longitude: 139.7671,
        address: '東京都千代田区',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO mansion URL with tokyo', async () => {
      const url = 'https://suumo.jp/mansion/tokyo/sc_shibuya/nc_12345678/';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        address: '東京都',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO mansion URL with osaka', async () => {
      const url = 'https://suumo.jp/mansion/osaka/sc_osaka/nc_12345678/';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 34.6937,
        longitude: 135.5023,
        address: '大阪府',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO ikkodate URL', async () => {
      const url = 'https://suumo.jp/ikkodate/tokyo/nc_12345678/';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        address: '東京都',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO chukoikkodate URL', async () => {
      const url = 'https://suumo.jp/chukoikkodate/tokyo/nc_12345678/';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        address: '東京都',
        source: 'suumo'
      });
    });

    it('should extract location from valid SUUMO tochi URL', async () => {
      const url = 'https://suumo.jp/tochi/tokyo/nc_12345678/';
      const result = await locationService.extractLocationFromSuumo(url);
      
      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        address: '東京都',
        source: 'suumo'
      });
    });

    it('should throw SuumoParsingError for invalid URL', async () => {
      await expect(locationService.extractLocationFromSuumo('invalid-url')).rejects.toThrow(SuumoParsingError);
      await expect(locationService.extractLocationFromSuumo('https://example.com')).rejects.toThrow(SuumoParsingError);
    });

    it('should throw SuumoParsingError for empty URL', async () => {
      await expect(locationService.extractLocationFromSuumo('')).rejects.toThrow(SuumoParsingError);
    });

    it('should throw SuumoParsingError for unsupported SUUMO URL pattern', async () => {
      const url = 'https://suumo.jp/unsupported/path/';
      await expect(locationService.extractLocationFromSuumo(url)).rejects.toThrow(SuumoParsingError);
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

    it('should create SuumoParsingError with correct name', () => {
      const error = new SuumoParsingError('test message');
      expect(error.name).toBe('SuumoParsingError');
      expect(error.message).toBe('test message');
    });

    it('should create GeolocationError with correct name', () => {
      const error = new GeolocationError('test message');
      expect(error.name).toBe('GeolocationError');
      expect(error.message).toBe('test message');
    });
  });
});