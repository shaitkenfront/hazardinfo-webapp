import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from './index';

/**
 * バリデーションエラークラス
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 座標情報のバリデーション
 */
export function validateCoordinates(data: any): Coordinates {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Coordinates data must be an object');
  }

  const { latitude, longitude, address, source } = data;

  // 緯度のバリデーション
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    throw new ValidationError('Latitude must be a valid number', 'latitude');
  }
  if (latitude < -90 || latitude > 90) {
    throw new ValidationError('Latitude must be between -90 and 90', 'latitude');
  }

  // 経度のバリデーション
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new ValidationError('Longitude must be a valid number', 'longitude');
  }
  if (longitude < -180 || longitude > 180) {
    throw new ValidationError('Longitude must be between -180 and 180', 'longitude');
  }

  // 日本国内の範囲チェック（おおよその範囲）
  if (latitude < 24 || latitude > 46 || longitude < 123 || longitude > 146) {
    throw new ValidationError('Coordinates must be within Japan', 'coordinates');
  }

  // 住所のバリデーション（オプション）
  if (address !== undefined && (typeof address !== 'string' || address.trim().length === 0)) {
    throw new ValidationError('Address must be a non-empty string', 'address');
  }

  // ソースのバリデーション
  const validSources = ['address', 'coordinates', 'geolocation'];
  if (!validSources.includes(source)) {
    throw new ValidationError(`Source must be one of: ${validSources.join(', ')}`, 'source');
  }

  return {
    latitude,
    longitude,
    address: address?.trim(),
    source
  };
}

/**
 * ハザード情報のバリデーション
 */
export function validateHazardInfo(data: any): HazardInfo {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('HazardInfo data must be an object');
  }

  const { type, riskLevel, description, source, lastUpdated, detailUrl } = data;

  // タイプのバリデーション
  const validTypes = ['flood', 'earthquake', 'landslide', 'tsunami', 'large_fill_land', 'high_tide', 'flood_keizoku', 'naisui', 'kaokutoukai_hanran', 'kaokutoukai_kagan', 'avalanche'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Type must be one of: ${validTypes.join(', ')}`, 'type');
  }

  // リスクレベルのバリデーション
  const validRiskLevels = ['low', 'medium', 'high', 'very_high'];
  if (!validRiskLevels.includes(riskLevel)) {
    throw new ValidationError(`Risk level must be one of: ${validRiskLevels.join(', ')}`, 'riskLevel');
  }

  // 説明のバリデーション
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new ValidationError('Description must be a non-empty string', 'description');
  }

  // ソースのバリデーション
  if (typeof source !== 'string' || source.trim().length === 0) {
    throw new ValidationError('Source must be a non-empty string', 'source');
  }

  // 更新日時のバリデーション
  const updatedDate = new Date(lastUpdated);
  if (isNaN(updatedDate.getTime())) {
    throw new ValidationError('LastUpdated must be a valid date', 'lastUpdated');
  }

  // 詳細URLのバリデーション（オプション）
  if (detailUrl !== undefined) {
    if (typeof detailUrl !== 'string' || detailUrl.trim().length === 0) {
      throw new ValidationError('DetailUrl must be a non-empty string', 'detailUrl');
    }
    try {
      new URL(detailUrl);
    } catch {
      throw new ValidationError('DetailUrl must be a valid URL', 'detailUrl');
    }
  }

  return {
    type,
    riskLevel,
    description: description.trim(),
    source: source.trim(),
    lastUpdated: updatedDate,
    detailUrl: detailUrl?.trim()
  };
}

/**
 * 避難所情報のバリデーション
 */
export function validateShelter(data: any): Shelter {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Shelter data must be an object');
  }

  const { name, address, coordinates, capacity, facilities, distance } = data;

  // 名前のバリデーション
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Name must be a non-empty string', 'name');
  }

  // 住所のバリデーション
  if (typeof address !== 'string' || address.trim().length === 0) {
    throw new ValidationError('Address must be a non-empty string', 'address');
  }

  // 座標のバリデーション
  const validatedCoordinates = validateCoordinates(coordinates);

  // 収容人数のバリデーション
  if (typeof capacity !== 'number' || capacity < 0 || !Number.isInteger(capacity)) {
    throw new ValidationError('Capacity must be a non-negative integer', 'capacity');
  }

  // 設備のバリデーション
  if (!Array.isArray(facilities)) {
    throw new ValidationError('Facilities must be an array', 'facilities');
  }
  for (let i = 0; i < facilities.length; i++) {
    if (typeof facilities[i] !== 'string' || facilities[i].trim().length === 0) {
      throw new ValidationError(`Facility at index ${i} must be a non-empty string`, 'facilities');
    }
  }

  // 距離のバリデーション
  if (typeof distance !== 'number' || distance < 0 || isNaN(distance)) {
    throw new ValidationError('Distance must be a non-negative number', 'distance');
  }

  return {
    name: name.trim(),
    address: address.trim(),
    coordinates: validatedCoordinates,
    capacity,
    facilities: facilities.map(f => f.trim()),
    distance
  };
}

/**
 * 災害イベント情報のバリデーション
 */
export function validateDisasterEvent(data: any): DisasterEvent {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('DisasterEvent data must be an object');
  }

  const { type, date, description, severity, source } = data;

  // タイプのバリデーション
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw new ValidationError('Type must be a non-empty string', 'type');
  }

  // 日付のバリデーション
  const eventDate = new Date(date);
  if (isNaN(eventDate.getTime())) {
    throw new ValidationError('Date must be a valid date', 'date');
  }

  // 説明のバリデーション
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new ValidationError('Description must be a non-empty string', 'description');
  }

  // 深刻度のバリデーション
  if (typeof severity !== 'string' || severity.trim().length === 0) {
    throw new ValidationError('Severity must be a non-empty string', 'severity');
  }

  // ソースのバリデーション
  if (typeof source !== 'string' || source.trim().length === 0) {
    throw new ValidationError('Source must be a non-empty string', 'source');
  }

  return {
    type: type.trim(),
    date: eventDate,
    description: description.trim(),
    severity: severity.trim(),
    source: source.trim()
  };
}

/**
 * 気象警報情報のバリデーション
 */
export function validateWeatherAlert(data: any): WeatherAlert {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('WeatherAlert data must be an object');
  }

  const { type, level, description, issuedAt, validUntil, area } = data;

  // タイプのバリデーション
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw new ValidationError('Type must be a non-empty string', 'type');
  }

  // レベルのバリデーション
  const validLevels = ['advisory', 'warning', 'emergency'];
  if (!validLevels.includes(level)) {
    throw new ValidationError(`Level must be one of: ${validLevels.join(', ')}`, 'level');
  }

  // 説明のバリデーション
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new ValidationError('Description must be a non-empty string', 'description');
  }

  // 発行日時のバリデーション
  const issuedDate = new Date(issuedAt);
  if (isNaN(issuedDate.getTime())) {
    throw new ValidationError('IssuedAt must be a valid date', 'issuedAt');
  }

  // 有効期限のバリデーション（オプション）
  let validUntilDate: Date | undefined;
  if (validUntil !== undefined) {
    validUntilDate = new Date(validUntil);
    if (isNaN(validUntilDate.getTime())) {
      throw new ValidationError('ValidUntil must be a valid date', 'validUntil');
    }
    if (validUntilDate <= issuedDate) {
      throw new ValidationError('ValidUntil must be after issuedAt', 'validUntil');
    }
  }

  // エリアのバリデーション
  if (typeof area !== 'string' || area.trim().length === 0) {
    throw new ValidationError('Area must be a non-empty string', 'area');
  }

  return {
    type: type.trim(),
    level,
    description: description.trim(),
    issuedAt: issuedDate,
    validUntil: validUntilDate,
    area: area.trim()
  };
}