/**
 * 入力バリデーション用のクラスとユーティリティ関数
 */

export class InputValidationError extends Error {
  constructor(message: string, public inputType?: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

/**
 * 住所バリデーションクラス
 */
export class AddressValidator {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 200;
  
  // 日本の都道府県リスト
  private static readonly PREFECTURES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  /**
   * 住所の基本的な形式をバリデーション
   */
  static validate(address: string): boolean {
    if (!address || typeof address !== 'string') {
      throw new InputValidationError('住所は文字列である必要があります', 'address');
    }

    const trimmedAddress = address.trim();

    if (trimmedAddress.length < this.MIN_LENGTH) {
      throw new InputValidationError(`住所は${this.MIN_LENGTH}文字以上である必要があります`, 'address');
    }

    if (trimmedAddress.length > this.MAX_LENGTH) {
      throw new InputValidationError(`住所は${this.MAX_LENGTH}文字以下である必要があります`, 'address');
    }

    // 日本の住所として妥当かチェック
    if (!this.isJapaneseAddress(trimmedAddress)) {
      throw new InputValidationError('日本国内の住所を入力してください', 'address');
    }

    return true;
  }

  /**
   * 日本の住所として妥当かチェック
   */
  private static isJapaneseAddress(address: string): boolean {
    // 都道府県名が含まれているかチェック
    const hasPrefecture = this.PREFECTURES.some(prefecture => 
      address.includes(prefecture)
    );

    if (hasPrefecture) {
      return true;
    }

    // 市区町村を示す文字が含まれているかチェック
    const cityIndicators = ['市', '区', '町', '村'];
    const hasCityIndicator = cityIndicators.some(indicator => 
      address.includes(indicator)
    );

    // 番地や丁目を示す文字が含まれているかチェック
    const addressIndicators = ['丁目', '番地', '番', '号', '-'];
    const hasAddressIndicator = addressIndicators.some(indicator => 
      address.includes(indicator)
    );

    return hasCityIndicator || hasAddressIndicator;
  }

  /**
   * 住所を正規化（トリム、全角数字を半角に変換など）
   */
  static normalize(address: string): string {
    if (!address || typeof address !== 'string') {
      return '';
    }

    return address
      .trim()
      .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
      .replace(/－/g, '-') // 全角ハイフンを半角に変換
      .replace(/\s+/g, ' ');
  }
}

/**
 * 緯度経度バリデーションクラス
 */
export class CoordinatesValidator {
  /**
   * 緯度経度の文字列をバリデーション
   */
  static validate(lat: string, lng: string): { latitude: number; longitude: number } {
    const latitude = this.validateLatitude(lat);
    const longitude = this.validateLongitude(lng);

    // 日本国内の範囲チェック
    if (!this.isWithinJapan(latitude, longitude)) {
      throw new InputValidationError('日本国内の座標を入力してください', 'coordinates');
    }

    return { latitude, longitude };
  }

  /**
   * 緯度のバリデーション
   */
  private static validateLatitude(lat: string): number {
    if (!lat || typeof lat !== 'string') {
      throw new InputValidationError('緯度は文字列である必要があります', 'latitude');
    }

    const trimmedLat = lat.trim();
    const latitude = parseFloat(trimmedLat);

    if (isNaN(latitude)) {
      throw new InputValidationError('緯度は数値である必要があります', 'latitude');
    }

    if (latitude < -90 || latitude > 90) {
      throw new InputValidationError('緯度は-90から90の範囲で入力してください', 'latitude');
    }

    return latitude;
  }

  /**
   * 経度のバリデーション
   */
  private static validateLongitude(lng: string): number {
    if (!lng || typeof lng !== 'string') {
      throw new InputValidationError('経度は文字列である必要があります', 'longitude');
    }

    const trimmedLng = lng.trim();
    const longitude = parseFloat(trimmedLng);

    if (isNaN(longitude)) {
      throw new InputValidationError('経度は数値である必要があります', 'longitude');
    }

    if (longitude < -180 || longitude > 180) {
      throw new InputValidationError('経度は-180から180の範囲で入力してください', 'longitude');
    }

    return longitude;
  }

  /**
   * 日本国内の座標かチェック
   */
  private static isWithinJapan(latitude: number, longitude: number): boolean {
    // 日本のおおよその範囲
    const JAPAN_BOUNDS = {
      north: 45.557,
      south: 24.045,
      east: 145.817,
      west: 122.934
    };

    return latitude >= JAPAN_BOUNDS.south && 
           latitude <= JAPAN_BOUNDS.north &&
           longitude >= JAPAN_BOUNDS.west && 
           longitude <= JAPAN_BOUNDS.east;
  }

  /**
   * 座標文字列を正規化
   */
  static normalize(coordinate: string): string {
    if (!coordinate || typeof coordinate !== 'string') {
      return '';
    }

    return coordinate
      .trim()
      .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
      .replace(/[．]/g, '.');
  }
}


/**
 * 位置情報解決APIのリクエストバリデーション結果
 */
export interface LocationInputValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 位置情報解決APIのリクエストボディ型定義
 */
export interface LocationResolveRequest {
  type: 'address' | 'coordinates' | 'geolocation';
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
}

/**
 * 位置情報解決APIのリクエストをバリデーション
 */
export function validateLocationInput(request: LocationResolveRequest): LocationInputValidationResult {
  const errors: string[] = [];

  // typeフィールドの必須チェック
  if (!request.type) {
    errors.push('typeフィールドは必須です');
    return { isValid: false, errors };
  }

  // 有効なtypeかチェック
  const validTypes = ['address', 'coordinates', 'geolocation'];
  if (!validTypes.includes(request.type)) {
    errors.push('typeは address, coordinates, geolocation のいずれかである必要があります');
    return { isValid: false, errors };
  }

  // タイプ別のバリデーション
  try {
    switch (request.type) {
      case 'address':
        if (!request.address) {
          errors.push('addressフィールドは必須です');
        } else {
          AddressValidator.validate(request.address);
        }
        break;

      case 'coordinates':
        if (request.latitude === undefined || request.longitude === undefined) {
          errors.push('latitudeとlongitudeフィールドは必須です');
        } else {
          CoordinatesValidator.validate(String(request.latitude), String(request.longitude));
        }
        break;


      case 'geolocation':
        if (request.latitude === undefined || request.longitude === undefined) {
          errors.push('現在地取得にはlatitudeとlongitudeフィールドが必須です');
        } else {
          // 数値型チェック
          const lat = Number(request.latitude);
          const lng = Number(request.longitude);
          
          if (isNaN(lat) || isNaN(lng)) {
            errors.push('緯度と経度は数値である必要があります');
          } else {
            CoordinatesValidator.validate(String(lat), String(lng));
          }
        }
        break;
    }
  } catch (error) {
    if (error instanceof InputValidationError) {
      errors.push(error.message);
    } else {
      errors.push('バリデーションエラーが発生しました');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}