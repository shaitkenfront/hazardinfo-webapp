import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../types';

/**
 * 位置情報解決APIのリクエスト型定義
 */
export interface LocationResolveRequest {
  type: 'address' | 'coordinates' | 'geolocation';
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
}

/**
 * 位置情報解決APIのレスポンス型定義
 */
export interface LocationResolveResponse {
  success: boolean;
  data?: {
    latitude: number;
    longitude: number;
    address?: string;
    source: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 防災情報取得APIのレスポンス型定義
 */
export interface DisasterInfoResponse {
  success: boolean;
  data?: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    hazardInfo: HazardInfo[];
    shelters: Shelter[];
    disasterHistory: DisasterEvent[];
    weatherAlerts: WeatherAlert[];
    lastUpdated: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * APIエラークラス
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * ローディング状態管理用の型
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * APIクライアントクラス
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = '/api', timeout: number = 60000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * HTTPリクエストを実行する共通メソッド
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // JSON解析に失敗した場合はデフォルトメッセージを使用
        }

        throw new ApiError(
          response.status.toString(),
          errorMessage,
          response.status
        );
      }

      const data = await response.json();
      
      // APIレスポンスがエラーを含む場合
      if (!data.success && data.error) {
        throw new ApiError(
          data.error.code,
          data.error.message
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('TIMEOUT', 'リクエストがタイムアウトしました');
        }
        throw new ApiError('NETWORK_ERROR', `ネットワークエラー: ${error.message}`);
      }
      
      throw new ApiError('UNKNOWN_ERROR', '不明なエラーが発生しました');
    }
  }

  /**
   * 位置情報を解決する
   */
  async resolveLocation(request: LocationResolveRequest): Promise<Coordinates> {
    const response = await this.request<LocationResolveResponse>('/location/resolve', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.data) {
      throw new ApiError('NO_DATA', '位置情報の取得に失敗しました');
    }

    return {
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      address: response.data.address,
      source: response.data.source as Coordinates['source'],
    };
  }

  /**
   * 住所から位置情報を取得する
   */
  async resolveAddress(address: string): Promise<Coordinates> {
    return this.resolveLocation({
      type: 'address',
      address,
    });
  }

  /**
   * 緯度経度から位置情報を取得する
   */
  async resolveCoordinates(latitude: number, longitude: number): Promise<Coordinates> {
    return this.resolveLocation({
      type: 'coordinates',
      latitude,
      longitude,
    });
  }



  /**
   * 現在地の位置情報を処理する
   */
  async resolveGeolocation(latitude: number, longitude: number): Promise<Coordinates> {
    return this.resolveLocation({
      type: 'geolocation',
      latitude,
      longitude,
    });
  }

  /**
   * 防災情報を取得する
   */
  async getDisasterInfo(latitude: number, longitude: number): Promise<{
    coordinates: { latitude: number; longitude: number };
    hazardInfo: HazardInfo[];
    shelters: Shelter[];
    disasterHistory: DisasterEvent[];
    weatherAlerts: WeatherAlert[];
    lastUpdated: string;
  }> {
    const response = await this.request<DisasterInfoResponse>(
      `/disaster-info/${latitude}/${longitude}`
    );

    if (!response.data) {
      throw new ApiError('NO_DATA', '防災情報の取得に失敗しました');
    }

    return response.data;
  }

  /**
   * ハザード情報のみを取得する
   */
  async getHazardInfo(latitude: number, longitude: number): Promise<HazardInfo[]> {
    const response = await this.request<{
      success: boolean;
      data?: {
        coordinates: { latitude: number; longitude: number };
        hazardInfo: HazardInfo[];
        lastUpdated: string;
      };
      error?: { code: string; message: string };
    }>(`/disaster-info/${latitude}/${longitude}/hazards`);

    if (!response.data) {
      throw new ApiError('NO_DATA', 'ハザード情報の取得に失敗しました');
    }

    return response.data.hazardInfo;
  }

  /**
   * 避難所情報のみを取得する
   */
  async getShelters(latitude: number, longitude: number): Promise<Shelter[]> {
    const response = await this.request<{
      success: boolean;
      data?: {
        coordinates: { latitude: number; longitude: number };
        shelters: Shelter[];
        lastUpdated: string;
      };
      error?: { code: string; message: string };
    }>(`/disaster-info/${latitude}/${longitude}/shelters`);

    if (!response.data) {
      throw new ApiError('NO_DATA', '避難所情報の取得に失敗しました');
    }

    return response.data.shelters;
  }

  /**
   * 災害履歴情報のみを取得する
   */
  async getDisasterHistory(latitude: number, longitude: number): Promise<DisasterEvent[]> {
    const response = await this.request<{
      success: boolean;
      data?: {
        coordinates: { latitude: number; longitude: number };
        disasterHistory: DisasterEvent[];
        lastUpdated: string;
      };
      error?: { code: string; message: string };
    }>(`/disaster-info/${latitude}/${longitude}/history`);

    if (!response.data) {
      throw new ApiError('NO_DATA', '災害履歴情報の取得に失敗しました');
    }

    return response.data.disasterHistory;
  }

  /**
   * 特定のハザードタイプのみを取得する（順次取得用）
   */
  async getSpecificHazardInfo(
    latitude: number, 
    longitude: number, 
    hazardType: string
  ): Promise<HazardInfo[]> {
    const response = await this.request<{
      success: boolean;
      data?: {
        coordinates: { latitude: number; longitude: number };
        hazardInfo: HazardInfo[];
        lastUpdated: string;
      };
      error?: { code: string; message: string };
    }>(`/disaster-info/${latitude}/${longitude}/hazards?types=${hazardType}`);

    if (!response.data) {
      throw new ApiError('NO_DATA', `${hazardType}ハザード情報の取得に失敗しました`);
    }

    return response.data.hazardInfo;
  }

  /**
   * 複数のハザード情報を順次取得する（進捗表示対応）
   */
  async getHazardInfoProgressive(
    latitude: number,
    longitude: number,
    onProgress?: (current: number, total: number, currentType: string) => void
  ): Promise<HazardInfo[]> {
    const hazardTypes = ['earthquake', 'flood', 'tsunami', 'high_tide', 'large_fill_land', 'landslide'];
    const allHazardInfo: HazardInfo[] = [];

    for (let i = 0; i < hazardTypes.length; i++) {
      const currentType = hazardTypes[i];
      
      if (onProgress) {
        onProgress(i + 1, hazardTypes.length, currentType);
      }

      try {
        const hazardInfo = await this.getSpecificHazardInfo(latitude, longitude, currentType);
        allHazardInfo.push(...hazardInfo);
      } catch (error) {
        console.warn(`Failed to fetch ${currentType} hazard info:`, error);
        // 個別のハザード情報取得に失敗しても続行
      }
    }

    return allHazardInfo;
  }
}

/**
 * デフォルトのAPIクライアントインスタンス
 */
export const apiClient = new ApiClient();