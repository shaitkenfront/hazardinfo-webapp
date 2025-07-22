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
   * SUUMO URLから物件の位置情報を抽出
   * @param url SUUMO URL
   * @returns 座標情報
   */
  extractLocationFromSuumo(url: string): Promise<Coordinates>;

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

export class SuumoParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SuumoParsingError';
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
   * SUUMO URLから位置情報を抽出
   */
  async extractLocationFromSuumo(url: string): Promise<Coordinates> {
    if (!url || !this.isValidSuumoUrl(url)) {
      throw new SuumoParsingError('有効なSUUMO URLを入力してください');
    }

    try {
      // SUUMO URLから物件情報を取得
      const locationData = await this.parseSuumoUrl(url);
      
      if (!locationData) {
        throw new SuumoParsingError('SUUMO URLから位置情報を取得できませんでした');
      }

      return {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
        source: 'suumo'
      };
    } catch (error) {
      if (error instanceof SuumoParsingError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new SuumoParsingError(`SUUMO URL解析エラー: ${errorMessage}`);
    }
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

  /**
   * SUUMO URLの妥当性をチェック
   */
  private isValidSuumoUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('suumo.jp') || urlObj.hostname === 'suumo.jp';
    } catch {
      return false;
    }
  }

  /**
   * SUUMO URLを解析して位置情報を取得
   */
  private async parseSuumoUrl(url: string): Promise<{latitude: number, longitude: number, address?: string} | null> {
    try {
      const urlObj = new URL(url);
      
      // 賃貸物件のURL解析
      if (url.includes('/chintai/')) {
        return this.parseChintaiUrl(urlObj);
      }
      
      // 分譲マンションのURL解析
      if (url.includes('/mansion/')) {
        return this.parseMansionUrl(urlObj);
      }
      
      // 新築一戸建てのURL解析
      if (url.includes('/ikkodate/')) {
        return this.parseIkkodateUrl(urlObj);
      }
      
      // 中古一戸建てのURL解析
      if (url.includes('/chukoikkodate/')) {
        return this.parseChukoIkkodateUrl(urlObj);
      }
      
      // 土地のURL解析
      if (url.includes('/tochi/')) {
        return this.parseTochiUrl(urlObj);
      }

      // サポートされていないURLパターン
      throw new SuumoParsingError('サポートされていないSUUMO URLパターンです');
    } catch (error) {
      throw new SuumoParsingError(`URL解析中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 賃貸物件URLを解析
   */
  private parseChintaiUrl(urlObj: URL): {latitude: number, longitude: number, address?: string} | null {
    // 実際の実装では、URLから物件IDを抽出してAPIを呼び出すか、
    // ページをスクレイピングして位置情報を取得する
    
    // モックデータ: URLパターンに基づいて異なる位置を返す
    const pathname = urlObj.pathname;
    
    if (pathname.includes('tokyo') || pathname.includes('13')) {
      return {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区'
      };
    }
    
    if (pathname.includes('osaka') || pathname.includes('27')) {
      return {
        latitude: 34.6937,
        longitude: 135.5023,
        address: '大阪府大阪市'
      };
    }
    
    if (pathname.includes('kanagawa') || pathname.includes('14')) {
      return {
        latitude: 35.4478,
        longitude: 139.6425,
        address: '神奈川県横浜市'
      };
    }

    // デフォルトは東京駅周辺
    return {
      latitude: 35.6812,
      longitude: 139.7671,
      address: '東京都千代田区'
    };
  }

  /**
   * 分譲マンションURLを解析
   */
  private parseMansionUrl(urlObj: URL): {latitude: number, longitude: number, address?: string} | null {
    const pathname = urlObj.pathname;
    
    // 地域コードまたは地域名から位置を推定
    if (pathname.includes('tokyo') || pathname.includes('13')) {
      return {
        latitude: 35.6895,
        longitude: 139.6917,
        address: '東京都'
      };
    }
    
    if (pathname.includes('osaka') || pathname.includes('27')) {
      return {
        latitude: 34.6937,
        longitude: 135.5023,
        address: '大阪府'
      };
    }

    return {
      latitude: 35.6812,
      longitude: 139.7671,
      address: '東京都'
    };
  }

  /**
   * 新築一戸建てURLを解析
   */
  private parseIkkodateUrl(urlObj: URL): {latitude: number, longitude: number, address?: string} | null {
    // 新築一戸建ての場合も同様の処理
    return this.parseMansionUrl(urlObj);
  }

  /**
   * 中古一戸建てURLを解析
   */
  private parseChukoIkkodateUrl(urlObj: URL): {latitude: number, longitude: number, address?: string} | null {
    // 中古一戸建ての場合も同様の処理
    return this.parseMansionUrl(urlObj);
  }

  /**
   * 土地URLを解析
   */
  private parseTochiUrl(urlObj: URL): {latitude: number, longitude: number, address?: string} | null {
    // 土地の場合も同様の処理
    return this.parseMansionUrl(urlObj);
  }
}