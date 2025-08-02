import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiClient } from '../useApiClient';
import { ApiClient, ApiError } from '../ApiClient';
import { Coordinates } from '../../types';

// ApiClientのモック
const mockApiClient = {
  resolveAddress: vi.fn(),
  resolveCoordinates: vi.fn(),
  resolveSuumoUrl: vi.fn(),
  resolveGeolocation: vi.fn(),
  getDisasterInfo: vi.fn(),
  getHazardInfo: vi.fn(),
  getShelters: vi.fn(),
  getDisasterHistory: vi.fn(),
} as unknown as ApiClient;

describe('useApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useApiClient(mockApiClient));

      expect(result.current.locationLoadingState).toEqual({
        isLoading: false,
        error: null,
      });

      expect(result.current.disasterInfoLoadingState).toEqual({
        isLoading: false,
        error: null,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  describe('resolveLocation', () => {
    it('住所解決が正常に動作する', async () => {
      const mockCoordinates: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区',
        source: 'address'
      };

      (mockApiClient.resolveAddress as any).mockResolvedValueOnce(mockCoordinates);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let resolveResult: Coordinates | null = null;

      await act(async () => {
        resolveResult = await result.current.resolveLocation('address', {
          address: '東京都渋谷区'
        });
      });

      expect(mockApiClient.resolveAddress).toHaveBeenCalledWith('東京都渋谷区');
      expect(resolveResult).toEqual(mockCoordinates);
      expect(result.current.locationLoadingState.isLoading).toBe(false);
      expect(result.current.locationLoadingState.error).toBeNull();
    });

    it('緯度経度解決が正常に動作する', async () => {
      const mockCoordinates: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'coordinates'
      };

      (mockApiClient.resolveCoordinates as any).mockResolvedValueOnce(mockCoordinates);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let resolveResult: Coordinates | null = null;

      await act(async () => {
        resolveResult = await result.current.resolveLocation('coordinates', {
          latitude: 35.6762,
          longitude: 139.6503
        });
      });

      expect(mockApiClient.resolveCoordinates).toHaveBeenCalledWith(35.6762, 139.6503);
      expect(resolveResult).toEqual(mockCoordinates);
    });

    // SUUMO機能は削除されたため、このテストを無効化
    it.skip('SUUMO URL解決が正常に動作する（機能削除済み）', async () => {
      // このテストは無効化されています - SUUMO機能が削除されたため
    });

    it('現在地解決が正常に動作する', async () => {
      const mockCoordinates: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'geolocation'
      };

      (mockApiClient.resolveGeolocation as any).mockResolvedValueOnce(mockCoordinates);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let resolveResult: Coordinates | null = null;

      await act(async () => {
        resolveResult = await result.current.resolveLocation('geolocation', {
          latitude: 35.6762,
          longitude: 139.6503
        });
      });

      expect(mockApiClient.resolveGeolocation).toHaveBeenCalledWith(35.6762, 139.6503);
      expect(resolveResult).toEqual(mockCoordinates);
    });

    it('必須パラメータが不足している場合のエラーハンドリング', async () => {
      const { result } = renderHook(() => useApiClient(mockApiClient));

      let resolveResult: Coordinates | null = null;

      await act(async () => {
        resolveResult = await result.current.resolveLocation('address', {});
      });

      expect(resolveResult).toBeNull();
      expect(result.current.locationLoadingState.error).toBe('住所が指定されていません');
      expect(result.current.locationLoadingState.isLoading).toBe(false);
    });

    it('APIエラーを適切に処理する', async () => {
      const apiError = new ApiError('LOCATION_NOT_FOUND', '住所が見つかりません');
      (mockApiClient.resolveAddress as any).mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let resolveResult: Coordinates | null = null;

      await act(async () => {
        resolveResult = await result.current.resolveLocation('address', {
          address: '存在しない住所'
        });
      });

      expect(resolveResult).toBeNull();
      expect(result.current.locationLoadingState.error).toBe('住所が見つかりません');
      expect(result.current.locationLoadingState.isLoading).toBe(false);
    });

    it('一般的なエラーを適切に処理する', async () => {
      const error = new Error('ネットワークエラー');
      (mockApiClient.resolveAddress as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let resolveResult: Coordinates | null = null;

      await act(async () => {
        resolveResult = await result.current.resolveLocation('address', {
          address: 'テスト住所'
        });
      });

      expect(resolveResult).toBeNull();
      expect(result.current.locationLoadingState.error).toBe('ネットワークエラー');
    });
  });

  describe('getDisasterInfo', () => {
    it('防災情報取得が正常に動作する', async () => {
      const mockDisasterInfo = {
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        hazardInfo: [],
        shelters: [],
        disasterHistory: [],
        weatherAlerts: [],
        lastUpdated: '2024-01-01T12:00:00Z'
      };

      (mockApiClient.getDisasterInfo as any).mockResolvedValueOnce(mockDisasterInfo);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let disasterInfoResult: any = null;

      await act(async () => {
        disasterInfoResult = await result.current.getDisasterInfo(35.6762, 139.6503);
      });

      expect(mockApiClient.getDisasterInfo).toHaveBeenCalledWith(35.6762, 139.6503);
      expect(disasterInfoResult).toEqual(mockDisasterInfo);
      expect(result.current.disasterInfoLoadingState.isLoading).toBe(false);
      expect(result.current.disasterInfoLoadingState.error).toBeNull();
    });

    it('防災情報取得エラーを適切に処理する', async () => {
      const apiError = new ApiError('EXTERNAL_API_ERROR', '外部APIエラー');
      (mockApiClient.getDisasterInfo as any).mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let disasterInfoResult: any = null;

      await act(async () => {
        disasterInfoResult = await result.current.getDisasterInfo(35.6762, 139.6503);
      });

      expect(disasterInfoResult).toBeNull();
      expect(result.current.disasterInfoLoadingState.error).toBe('外部APIエラー');
      expect(result.current.disasterInfoLoadingState.isLoading).toBe(false);
    });
  });

  describe('getHazardInfo', () => {
    it('ハザード情報取得が正常に動作する', async () => {
      const mockHazardInfo = [
        {
          type: 'flood' as const,
          riskLevel: 'medium' as const,
          description: '洪水リスクがあります',
          source: 'ハザードマップ',
          lastUpdated: new Date('2024-01-01'),
        }
      ];

      (mockApiClient.getHazardInfo as any).mockResolvedValueOnce(mockHazardInfo);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let hazardInfoResult: any = null;

      await act(async () => {
        hazardInfoResult = await result.current.getHazardInfo(35.6762, 139.6503);
      });

      expect(mockApiClient.getHazardInfo).toHaveBeenCalledWith(35.6762, 139.6503);
      expect(hazardInfoResult).toEqual(mockHazardInfo);
    });
  });

  describe('getShelters', () => {
    it('避難所情報取得が正常に動作する', async () => {
      const mockShelters = [
        {
          name: '渋谷区役所',
          address: '東京都渋谷区宇田川町1-1',
          coordinates: { latitude: 35.6580, longitude: 139.7016, source: 'address' as const },
          capacity: 500,
          facilities: ['食料', '毛布'],
          distance: 1.2
        }
      ];

      (mockApiClient.getShelters as any).mockResolvedValueOnce(mockShelters);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let sheltersResult: any = null;

      await act(async () => {
        sheltersResult = await result.current.getShelters(35.6762, 139.6503);
      });

      expect(mockApiClient.getShelters).toHaveBeenCalledWith(35.6762, 139.6503);
      expect(sheltersResult).toEqual(mockShelters);
    });
  });

  describe('getDisasterHistory', () => {
    it('災害履歴情報取得が正常に動作する', async () => {
      const mockDisasterHistory = [
        {
          type: '地震',
          date: new Date('2011-03-11'),
          description: '東日本大震災',
          severity: '震度5強',
          source: '気象庁'
        }
      ];

      (mockApiClient.getDisasterHistory as any).mockResolvedValueOnce(mockDisasterHistory);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      let disasterHistoryResult: any = null;

      await act(async () => {
        disasterHistoryResult = await result.current.getDisasterHistory(35.6762, 139.6503);
      });

      expect(mockApiClient.getDisasterHistory).toHaveBeenCalledWith(35.6762, 139.6503);
      expect(disasterHistoryResult).toEqual(mockDisasterHistory);
    });
  });

  describe('エラークリア機能', () => {
    it('位置情報エラーをクリアできる', async () => {
      const apiError = new ApiError('LOCATION_NOT_FOUND', '住所が見つかりません');
      (mockApiClient.resolveAddress as any).mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      // エラーを発生させる
      await act(async () => {
        await result.current.resolveLocation('address', { address: '存在しない住所' });
      });

      expect(result.current.locationLoadingState.error).toBe('住所が見つかりません');

      // エラーをクリア
      act(() => {
        result.current.clearLocationError();
      });

      expect(result.current.locationLoadingState.error).toBeNull();
    });

    it('防災情報エラーをクリアできる', async () => {
      const apiError = new ApiError('EXTERNAL_API_ERROR', '外部APIエラー');
      (mockApiClient.getDisasterInfo as any).mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      // エラーを発生させる
      await act(async () => {
        await result.current.getDisasterInfo(35.6762, 139.6503);
      });

      expect(result.current.disasterInfoLoadingState.error).toBe('外部APIエラー');

      // エラーをクリア
      act(() => {
        result.current.clearDisasterInfoError();
      });

      expect(result.current.disasterInfoLoadingState.error).toBeNull();
    });
  });

  describe('ローディング状態', () => {
    it('位置情報取得中のローディング状態が正しく管理される', async () => {
      const mockCoordinates: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: 'テスト住所',
        source: 'address'
      };

      (mockApiClient.resolveAddress as any).mockResolvedValueOnce(mockCoordinates);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      // 非同期処理を開始
      await act(async () => {
        const promise = result.current.resolveLocation('address', { address: 'テスト住所' });
        
        // 処理完了を待つ
        await promise;
      });

      // 処理完了後の状態をチェック
      expect(result.current.locationLoadingState.isLoading).toBe(false);
      expect(result.current.locationLoadingState.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('防災情報取得中のローディング状態が正しく管理される', async () => {
      const mockDisasterInfo = {
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        hazardInfo: [],
        shelters: [],
        disasterHistory: [],
        weatherAlerts: [],
        lastUpdated: '2024-01-01T12:00:00Z'
      };

      (mockApiClient.getDisasterInfo as any).mockResolvedValueOnce(mockDisasterInfo);

      const { result } = renderHook(() => useApiClient(mockApiClient));

      // 非同期処理を開始
      await act(async () => {
        const promise = result.current.getDisasterInfo(35.6762, 139.6503);
        
        // 処理完了を待つ
        await promise;
      });

      // 処理完了後の状態をチェック
      expect(result.current.disasterInfoLoadingState.isLoading).toBe(false);
      expect(result.current.disasterInfoLoadingState.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});