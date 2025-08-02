import { useState, useCallback } from 'react';
import { ApiClient, ApiError, LoadingState } from './ApiClient';
import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../types';

/**
 * APIクライアント用のReactフック
 */
export function useApiClient(apiClient: ApiClient) {
  const [locationLoadingState, setLocationLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  const [disasterInfoLoadingState, setDisasterInfoLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  /**
   * 位置情報解決のラッパー関数
   */
  const resolveLocation = useCallback(async (
    type: 'address' | 'coordinates' | 'geolocation',
    params: {
      address?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<Coordinates | null> => {
    setLocationLoadingState({ isLoading: true, error: null });

    try {
      let result: Coordinates;

      switch (type) {
        case 'address':
          if (!params.address) {
            throw new Error('住所が指定されていません');
          }
          result = await apiClient.resolveAddress(params.address);
          break;

        case 'coordinates':
          if (params.latitude === undefined || params.longitude === undefined) {
            throw new Error('緯度と経度が指定されていません');
          }
          result = await apiClient.resolveCoordinates(params.latitude, params.longitude);
          break;



        case 'geolocation':
          if (params.latitude === undefined || params.longitude === undefined) {
            throw new Error('現在地の緯度と経度が指定されていません');
          }
          result = await apiClient.resolveGeolocation(params.latitude, params.longitude);
          break;

        default:
          throw new Error('無効な位置情報タイプです');
      }

      setLocationLoadingState({ isLoading: false, error: null });
      return result;

    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : '位置情報の取得に失敗しました';

      setLocationLoadingState({ isLoading: false, error: errorMessage });
      return null;
    }
  }, [apiClient]);

  /**
   * 防災情報取得のラッパー関数
   */
  const getDisasterInfo = useCallback(async (
    latitude: number,
    longitude: number
  ): Promise<{
    coordinates: { latitude: number; longitude: number };
    hazardInfo: HazardInfo[];
    shelters: Shelter[];
    disasterHistory: DisasterEvent[];
    weatherAlerts: WeatherAlert[];
    lastUpdated: string;
  } | null> => {
    setDisasterInfoLoadingState({ isLoading: true, error: null });

    try {
      const result = await apiClient.getDisasterInfo(latitude, longitude);
      setDisasterInfoLoadingState({ isLoading: false, error: null });
      return result;

    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : '防災情報の取得に失敗しました';

      setDisasterInfoLoadingState({ isLoading: false, error: errorMessage });
      return null;
    }
  }, [apiClient]);

  /**
   * ハザード情報のみ取得のラッパー関数
   */
  const getHazardInfo = useCallback(async (
    latitude: number,
    longitude: number
  ): Promise<HazardInfo[] | null> => {
    setDisasterInfoLoadingState({ isLoading: true, error: null });

    try {
      const result = await apiClient.getHazardInfo(latitude, longitude);
      setDisasterInfoLoadingState({ isLoading: false, error: null });
      return result;

    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'ハザード情報の取得に失敗しました';

      setDisasterInfoLoadingState({ isLoading: false, error: errorMessage });
      return null;
    }
  }, [apiClient]);

  /**
   * 避難所情報のみ取得のラッパー関数
   */
  const getShelters = useCallback(async (
    latitude: number,
    longitude: number
  ): Promise<Shelter[] | null> => {
    setDisasterInfoLoadingState({ isLoading: true, error: null });

    try {
      const result = await apiClient.getShelters(latitude, longitude);
      setDisasterInfoLoadingState({ isLoading: false, error: null });
      return result;

    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : '避難所情報の取得に失敗しました';

      setDisasterInfoLoadingState({ isLoading: false, error: errorMessage });
      return null;
    }
  }, [apiClient]);

  /**
   * 災害履歴情報のみ取得のラッパー関数
   */
  const getDisasterHistory = useCallback(async (
    latitude: number,
    longitude: number
  ): Promise<DisasterEvent[] | null> => {
    setDisasterInfoLoadingState({ isLoading: true, error: null });

    try {
      const result = await apiClient.getDisasterHistory(latitude, longitude);
      setDisasterInfoLoadingState({ isLoading: false, error: null });
      return result;

    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : '災害履歴情報の取得に失敗しました';

      setDisasterInfoLoadingState({ isLoading: false, error: errorMessage });
      return null;
    }
  }, [apiClient]);

  /**
   * エラー状態をクリアする関数
   */
  const clearLocationError = useCallback(() => {
    setLocationLoadingState(prev => ({ ...prev, error: null }));
  }, []);

  const clearDisasterInfoError = useCallback(() => {
    setDisasterInfoLoadingState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // 位置情報関連
    resolveLocation,
    locationLoadingState,
    clearLocationError,

    // 防災情報関連
    getDisasterInfo,
    getHazardInfo,
    getShelters,
    getDisasterHistory,
    disasterInfoLoadingState,
    clearDisasterInfoError,

    // 全体的なローディング状態
    isLoading: locationLoadingState.isLoading || disasterInfoLoadingState.isLoading,
    hasError: !!(locationLoadingState.error || disasterInfoLoadingState.error),
  };
}