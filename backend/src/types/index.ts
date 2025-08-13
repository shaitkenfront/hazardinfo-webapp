/**
 * 座標情報を表すインターフェース
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  address?: string;
  source: 'address' | 'coordinates' | 'geolocation';
}

/**
 * ハザード情報を表すインターフェース
 */
export interface HazardInfo {
  type: 'flood' | 'earthquake' | 'landslide' | 'tsunami' | 'large_scale_fill' | 'high_tide' | 'flood_keizoku' | 'naisui' | 'kaokutoukai_hanran' | 'kaokutoukai_kagan' | 'avalanche';
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  description: string;
  source: string;
  lastUpdated: Date;
  detailUrl?: string;
}

/**
 * 避難所情報を表すインターフェース
 */
export interface Shelter {
  name: string;
  address: string;
  coordinates: Coordinates;
  capacity: number;
  facilities: string[];
  distance: number;
}

/**
 * 災害イベント情報を表すインターフェース
 */
export interface DisasterEvent {
  type: string;
  date: Date;
  description: string;
  severity: string;
  source: string;
}

/**
 * 気象警報情報を表すインターフェース
 */
export interface WeatherAlert {
  type: string;
  level: 'advisory' | 'warning' | 'emergency';
  description: string;
  issuedAt: Date;
  validUntil?: Date;
  area: string;
}

// バリデーション関数をエクスポート
export {
  ValidationError,
  validateCoordinates,
  validateHazardInfo,
  validateShelter,
  validateDisasterEvent,
  validateWeatherAlert
} from './validation';