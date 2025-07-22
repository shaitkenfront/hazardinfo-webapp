import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../types';

/**
 * 外部API呼び出しエラー
 */
export class ExternalAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly apiName?: string
  ) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}

/**
 * 防災情報サービスのインターフェース
 */
export interface IDisasterInfoService {
  getHazardMapInfo(coordinates: Coordinates): Promise<HazardInfo[]>;
  getEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]>;
  getDisasterHistory(coordinates: Coordinates): Promise<DisasterEvent[]>;
  getWeatherAlerts(coordinates: Coordinates): Promise<WeatherAlert[]>;
}

/**
 * 防災情報取得サービス
 */
export class DisasterInfoService implements IDisasterInfoService {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 10000, // 10秒のタイムアウト
      headers: {
        'User-Agent': 'DisasterInfoApp/1.0',
        'Accept': 'application/json',
      },
    });

    // レスポンスインターセプターでエラーハンドリング
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response) {
          // サーバーからエラーレスポンスが返された場合
          throw new ExternalAPIError(
            `API request failed: ${error.response.status} ${error.response.statusText}`,
            error.response.status,
            error.config?.baseURL || 'unknown'
          );
        } else if (error.request) {
          // リクエストが送信されたが、レスポンスが受信されなかった場合
          throw new ExternalAPIError(
            'No response received from API',
            undefined,
            error.config?.baseURL || 'unknown'
          );
        } else {
          // リクエスト設定中にエラーが発生した場合
          throw new ExternalAPIError(
            `Request setup error: ${error.message}`,
            undefined,
            'unknown'
          );
        }
      }
    );
  }

  /**
   * ハザードマップ情報を取得
   */
  async getHazardMapInfo(coordinates: Coordinates): Promise<HazardInfo[]> {
    // 基本実装 - 後続のタスクで詳細実装
    try {
      // TODO: 実際の外部API呼び出しを実装
      return [];
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      throw new ExternalAPIError(
        `Failed to fetch hazard map info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'hazard-map-api'
      );
    }
  }

  /**
   * 避難所情報を取得
   */
  async getEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]> {
    // 基本実装 - 後続のタスクで詳細実装
    try {
      // TODO: 実際の外部API呼び出しを実装
      return [];
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      throw new ExternalAPIError(
        `Failed to fetch evacuation shelters: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'shelter-api'
      );
    }
  }

  /**
   * 災害履歴情報を取得
   */
  async getDisasterHistory(coordinates: Coordinates): Promise<DisasterEvent[]> {
    // 基本実装 - 後続のタスクで詳細実装
    try {
      // TODO: 実際の外部API呼び出しを実装
      return [];
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      throw new ExternalAPIError(
        `Failed to fetch disaster history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'disaster-history-api'
      );
    }
  }

  /**
   * 気象警報情報を取得
   */
  async getWeatherAlerts(coordinates: Coordinates): Promise<WeatherAlert[]> {
    // 基本実装 - 後続のタスクで詳細実装
    try {
      // TODO: 実際の外部API呼び出しを実装
      return [];
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      throw new ExternalAPIError(
        `Failed to fetch weather alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'weather-api'
      );
    }
  }

  /**
   * HTTPクライアントを取得（テスト用）
   */
  getHttpClient(): AxiosInstance {
    return this.httpClient;
  }
}