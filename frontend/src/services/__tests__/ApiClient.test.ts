import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient, ApiError } from '../ApiClient';
// import { Coordinates } from '../../types'; // unused

// fetchのモック
const mockFetch = vi.fn();
// @ts-ignore - global definition for test environment
(global as any).fetch = mockFetch;

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('/api', 5000);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('デフォルト値で初期化される', () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('カスタム値で初期化される', () => {
      const client = new ApiClient('/custom-api', 15000);
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('resolveAddress', () => {
    it('住所から位置情報を正常に取得する', async () => {
      const mockResponse = {
        success: true,
        data: {
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都渋谷区',
          source: 'address'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.resolveAddress('東京都渋谷区');

      expect(mockFetch).toHaveBeenCalledWith('/api/location/resolve', {
        method: 'POST',
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'address',
          address: '東京都渋谷区',
        }),
      });

      expect(result).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区',
        source: 'address'
      });
    });

    it('APIエラーレスポンスを適切に処理する', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: '指定された住所が見つかりません'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      try {
        await apiClient.resolveAddress('存在しない住所');
        expect.fail('エラーが発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('LOCATION_NOT_FOUND');
        expect((error as ApiError).message).toBe('指定された住所が見つかりません');
      }
    });
  });

  describe('resolveCoordinates', () => {
    it('緯度経度から位置情報を正常に取得する', async () => {
      const mockResponse = {
        success: true,
        data: {
          latitude: 35.6762,
          longitude: 139.6503,
          source: 'coordinates'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.resolveCoordinates(35.6762, 139.6503);

      expect(mockFetch).toHaveBeenCalledWith('/api/location/resolve', {
        method: 'POST',
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'coordinates',
          latitude: 35.6762,
          longitude: 139.6503,
        }),
      });

      expect(result).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'coordinates'
      });
    });
  });


  describe('resolveGeolocation', () => {
    it('現在地の位置情報を正常に処理する', async () => {
      const mockResponse = {
        success: true,
        data: {
          latitude: 35.6762,
          longitude: 139.6503,
          source: 'geolocation'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.resolveGeolocation(35.6762, 139.6503);

      expect(mockFetch).toHaveBeenCalledWith('/api/location/resolve', {
        method: 'POST',
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'geolocation',
          latitude: 35.6762,
          longitude: 139.6503,
        }),
      });

      expect(result).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'geolocation'
      });
    });
  });

  describe('getDisasterInfo', () => {
    it('防災情報を正常に取得する', async () => {
      const mockResponse = {
        success: true,
        data: {
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          hazardInfo: [
            {
              type: 'flood',
              riskLevel: 'medium',
              description: '洪水リスクがあります',
              source: 'ハザードマップ',
              lastUpdated: new Date('2024-01-01'),
            }
          ],
          shelters: [
            {
              name: '渋谷区役所',
              address: '東京都渋谷区宇田川町1-1',
              coordinates: { latitude: 35.6580, longitude: 139.7016, source: 'address' },
              capacity: 500,
              facilities: ['食料', '毛布'],
              distance: 1.2
            }
          ],
          disasterHistory: [
            {
              type: '地震',
              date: new Date('2011-03-11'),
              description: '東日本大震災',
              severity: '震度5強',
              source: '気象庁'
            }
          ],
          weatherAlerts: [
            {
              type: '大雨警報',
              level: 'warning',
              description: '大雨による土砂災害に注意',
              issuedAt: new Date('2024-01-01T10:00:00Z'),
              area: '東京都'
            }
          ],
          lastUpdated: '2024-01-01T12:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.getDisasterInfo(35.6762, 139.6503);

      expect(mockFetch).toHaveBeenCalledWith('/api/disaster-info/35.6762/139.6503', {
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('防災情報取得時のエラーを適切に処理する', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'COORDINATES_OUT_OF_RANGE',
          message: '日本国内の座標を指定してください'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(apiClient.getDisasterInfo(0, 0))
        .rejects
        .toThrow(ApiError);
    });
  });

  describe('getHazardInfo', () => {
    it('ハザード情報のみを正常に取得する', async () => {
      const mockResponse = {
        success: true,
        data: {
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          hazardInfo: [
            {
              type: 'flood',
              riskLevel: 'medium',
              description: '洪水リスクがあります',
              source: 'ハザードマップ',
              lastUpdated: new Date('2024-01-01'),
            }
          ],
          lastUpdated: '2024-01-01T12:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.getHazardInfo(35.6762, 139.6503);

      expect(mockFetch).toHaveBeenCalledWith('/api/disaster-info/35.6762/139.6503/hazards', {
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse.data.hazardInfo);
    });
  });

  describe('getShelters', () => {
    it('避難所情報のみを正常に取得する', async () => {
      const mockResponse = {
        success: true,
        data: {
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          shelters: [
            {
              name: '渋谷区役所',
              address: '東京都渋谷区宇田川町1-1',
              coordinates: { latitude: 35.6580, longitude: 139.7016, source: 'address' },
              capacity: 500,
              facilities: ['食料', '毛布'],
              distance: 1.2
            }
          ],
          lastUpdated: '2024-01-01T12:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.getShelters(35.6762, 139.6503);

      expect(result).toEqual(mockResponse.data.shelters);
    });
  });

  describe('getDisasterHistory', () => {
    it('災害履歴情報のみを正常に取得する', async () => {
      const mockResponse = {
        success: true,
        data: {
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          disasterHistory: [
            {
              type: '地震',
              date: new Date('2011-03-11'),
              description: '東日本大震災',
              severity: '震度5強',
              source: '気象庁'
            }
          ],
          lastUpdated: '2024-01-01T12:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.getDisasterHistory(35.6762, 139.6503);

      expect(result).toEqual(mockResponse.data.disasterHistory);
    });
  });

  describe('エラーハンドリング', () => {
    it('HTTPエラーを適切に処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      try {
        await apiClient.resolveAddress('テスト住所');
        expect.fail('エラーが発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('ネットワークエラーを適切に処理する', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.resolveAddress('テスト住所'))
        .rejects
        .toThrow(ApiError);

      try {
        await apiClient.resolveAddress('テスト住所');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NETWORK_ERROR');
      }
    });

    it('タイムアウトエラーを適切に処理する', async () => {
      // タイムアウトをシミュレート
      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const shortTimeoutClient = new ApiClient('/api', 50);

      try {
        await shortTimeoutClient.resolveAddress('テスト住所');
        expect.fail('エラーが発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('TIMEOUT');
      }
    });

    it('データが存在しない場合のエラーを処理する', async () => {
      const mockResponse = {
        success: true,
        // dataフィールドが存在しない
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      try {
        await apiClient.resolveAddress('テスト住所');
        expect.fail('エラーが発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NO_DATA');
      }
    });
  });
});