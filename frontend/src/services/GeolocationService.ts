import { Coordinates } from '../types';

/**
 * 位置情報取得エラーの種類
 */
export enum GeolocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NOT_SUPPORTED = 'NOT_SUPPORTED'
}

/**
 * 位置情報取得エラークラス
 */
export class GeolocationError extends Error {
  public readonly type: GeolocationErrorType;
  public readonly code?: number;

  constructor(type: GeolocationErrorType, message: string, code?: number) {
    super(message);
    this.name = 'GeolocationError';
    this.type = type;
    this.code = code;
  }
}

/**
 * 位置情報取得オプション
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * 位置情報取得サービス
 */
export class GeolocationService {
  private static readonly DEFAULT_OPTIONS: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10秒
    maximumAge: 300000 // 5分
  };

  /**
   * 現在地を取得
   * @param options 位置情報取得オプション
   * @returns 座標情報
   */
  async getCurrentLocation(options?: GeolocationOptions): Promise<Coordinates> {
    // Geolocation APIがサポートされているかチェック
    if (!this.isGeolocationSupported()) {
      throw new GeolocationError(
        GeolocationErrorType.NOT_SUPPORTED,
        'このブラウザは位置情報取得をサポートしていません'
      );
    }

    const finalOptions = { ...GeolocationService.DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: 'geolocation'
          };
          resolve(coords);
        },
        (error) => {
          reject(this.handleGeolocationError(error));
        },
        finalOptions
      );
    });
  }

  /**
   * 位置情報の監視を開始
   * @param callback 位置情報が更新された時のコールバック
   * @param errorCallback エラー発生時のコールバック
   * @param options 位置情報取得オプション
   * @returns 監視ID（停止時に使用）
   */
  watchPosition(
    callback: (coordinates: Coordinates) => void,
    errorCallback: (error: GeolocationError) => void,
    options?: GeolocationOptions
  ): number | null {
    if (!this.isGeolocationSupported()) {
      errorCallback(new GeolocationError(
        GeolocationErrorType.NOT_SUPPORTED,
        'このブラウザは位置情報取得をサポートしていません'
      ));
      return null;
    }

    const finalOptions = { ...GeolocationService.DEFAULT_OPTIONS, ...options };

    return navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'geolocation'
        };
        callback(coords);
      },
      (error) => {
        errorCallback(this.handleGeolocationError(error));
      },
      finalOptions
    );
  }

  /**
   * 位置情報の監視を停止
   * @param watchId 監視ID
   */
  clearWatch(watchId: number): void {
    if (this.isGeolocationSupported()) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * 位置情報取得の許可状態をチェック
   * @returns 許可状態
   */
  async checkPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      // permissions APIがサポートされていない場合は不明を返す
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch {
      return 'prompt';
    }
  }

  /**
   * Geolocation APIがサポートされているかチェック
   * @returns サポート状況
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * 位置情報取得エラーを処理
   * @param error GeolocationPositionError
   * @returns GeolocationError
   */
  private handleGeolocationError(error: GeolocationPositionError): GeolocationError {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return new GeolocationError(
          GeolocationErrorType.PERMISSION_DENIED,
          '位置情報の取得が拒否されました。ブラウザの設定で位置情報の使用を許可してください。',
          error.code
        );
      case 2: // POSITION_UNAVAILABLE
        return new GeolocationError(
          GeolocationErrorType.POSITION_UNAVAILABLE,
          '位置情報を取得できませんでした。GPS信号が弱いか、位置情報サービスが利用できません。',
          error.code
        );
      case 3: // TIMEOUT
        return new GeolocationError(
          GeolocationErrorType.TIMEOUT,
          '位置情報の取得がタイムアウトしました。再度お試しください。',
          error.code
        );
      default:
        return new GeolocationError(
          GeolocationErrorType.POSITION_UNAVAILABLE,
          `位置情報の取得中に不明なエラーが発生しました: ${error.message}`,
          error.code
        );
    }
  }
}