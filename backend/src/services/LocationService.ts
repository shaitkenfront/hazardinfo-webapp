import { Coordinates } from '../types';

/**
 * 位置情報解決サービスのインターフェース
 */
export interface ILocationService {
  /**
   * 住所から緯度経度に変換
   * @param address 住所文字列
   * @returns 座標情報
   */
  resolveAddress(address: string): Promise<Coordinates>;

  /**
   * 緯度経度文字列を解析してCoordinatesオブジェクトに変換
   * @param lat 緯度文字列
   * @param lng 経度文字列
   * @returns 座標情報
   */
  parseCoordinates(lat: string, lng: string): Promise<Coordinates>;

  /**
   * 現在地を取得（フロントエンド用）
   * @returns 座標情報
   */
  getCurrentLocation(): Promise<Coordinates>;

  /**
   * フロントエンドから受け取った位置情報を処理
   * @param latitude 緯度
   * @param longitude 経度
   * @returns 座標情報
   */
  processGeolocationCoordinates(latitude: number, longitude: number): Promise<Coordinates>;
}

/**
 * カスタムエラークラス
 */
export class LocationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationNotFoundError';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}



export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeolocationError';
  }
}

/**
 * 位置情報解決サービスの実装
 */
export class LocationService implements ILocationService {
  
  /**
   * 住所から緯度経度に変換
   * 現在は国土地理院のジオコーディングAPIを使用する想定
   */
  async resolveAddress(address: string): Promise<Coordinates> {
    if (!address || address.trim().length === 0) {
      throw new InvalidInputError('住所が入力されていません');
    }

    try {
      // 国土地理院のジオコーディングAPIを使用
      // 実際の実装では外部APIを呼び出す
      const response = await this.callGeocodingAPI(address);
      
      if (!response || response.length === 0) {
        throw new LocationNotFoundError(`住所が見つかりません: ${address}`);
      }

      const result = response[0];
      return {
        latitude: parseFloat(result.geometry.coordinates[1]),
        longitude: parseFloat(result.geometry.coordinates[0]),
        address: address,
        source: 'address'
      };
    } catch (error) {
      if (error instanceof LocationNotFoundError || error instanceof InvalidInputError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new LocationNotFoundError(`住所の解決に失敗しました: ${errorMessage}`);
    }
  }

  /**
   * 緯度経度文字列を解析
   */
  async parseCoordinates(lat: string, lng: string): Promise<Coordinates> {
    if (!lat || !lng) {
      throw new InvalidInputError('緯度と経度の両方を入力してください');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new InvalidInputError('緯度と経度は数値で入力してください');
    }

    // 日本の緯度経度範囲をチェック
    if (latitude < 20 || latitude > 46 || longitude < 122 || longitude > 154) {
      throw new InvalidInputError('日本国内の緯度経度を入力してください');
    }

    return {
      latitude,
      longitude,
      source: 'coordinates'
    };
  }



  /**
   * 現在地を取得（ブラウザのGeolocation API用）
   * 注意: これはフロントエンド側で実装される機能のインターフェース
   * バックエンドでは、フロントエンドから受け取った座標を処理する
   */
  async getCurrentLocation(): Promise<Coordinates> {
    // この機能は実際にはフロントエンド側で実装される
    // バックエンドでは位置情報を受け取って処理するのみ
    throw new GeolocationError('現在地取得はフロントエンド側で実装してください');
  }

  /**
   * フロントエンドから受け取った位置情報を処理
   * @param latitude 緯度
   * @param longitude 経度
   * @returns 座標情報
   */
  async processGeolocationCoordinates(latitude: number, longitude: number): Promise<Coordinates> {
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new InvalidInputError('有効な緯度と経度を指定してください');
    }

    // 日本の緯度経度範囲をチェック
    if (latitude < 20 || latitude > 46 || longitude < 122 || longitude > 154) {
      throw new InvalidInputError('日本国内の緯度経度を指定してください');
    }

    return {
      latitude,
      longitude,
      source: 'geolocation'
    };
  }

  /**
   * 国土地理院ジオコーディングAPIを呼び出す（プライベートメソッド）
   */
  private async callGeocodingAPI(address: string): Promise<any[]> {
    // 実際の実装では fetch を使用して外部APIを呼び出す
    // 現在はモックデータを返す
    
    // モックレスポンス（実際のAPIレスポンス形式に合わせる）
    if (address.includes('東京')) {
      return [{
        geometry: {
          coordinates: [139.6917, 35.6895] // 東京駅の座標
        },
        properties: {
          title: address
        }
      }];
    }
    
    if (address.includes('大阪')) {
      return [{
        geometry: {
          coordinates: [135.5023, 34.6937] // 大阪駅の座標
        },
        properties: {
          title: address
        }
      }];
    }

    // 住所が見つからない場合
    return [];
  }


}