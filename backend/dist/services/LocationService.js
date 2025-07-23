"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = exports.GeolocationError = exports.InvalidInputError = exports.LocationNotFoundError = void 0;
/**
 * カスタムエラークラス
 */
class LocationNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LocationNotFoundError';
    }
}
exports.LocationNotFoundError = LocationNotFoundError;
class InvalidInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidInputError';
    }
}
exports.InvalidInputError = InvalidInputError;
class GeolocationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GeolocationError';
    }
}
exports.GeolocationError = GeolocationError;
/**
 * 位置情報解決サービスの実装
 */
class LocationService {
    /**
     * 住所から緯度経度に変換
     * 現在は国土地理院のジオコーディングAPIを使用する想定
     */
    async resolveAddress(address) {
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
        }
        catch (error) {
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
    async parseCoordinates(lat, lng) {
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
    async getCurrentLocation() {
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
    async processGeolocationCoordinates(latitude, longitude) {
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
     * Google Maps Geocoding APIを呼び出す（プライベートメソッド）
     */
    async callGeocodingAPI(address) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY環境変数が設定されていません');
        }
        const encodedAddress = encodeURIComponent(address);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=jp`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.status === 'ZERO_RESULTS') {
                return [];
            }
            if (data.status !== 'OK') {
                throw new Error(`Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            }
            // Google Maps APIのレスポンス形式を国土地理院形式に変換
            return data.results.map((result) => ({
                geometry: {
                    coordinates: [
                        result.geometry.location.lng,
                        result.geometry.location.lat
                    ]
                },
                properties: {
                    title: result.formatted_address
                }
            }));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Geocoding APIの呼び出しに失敗しました: ${errorMessage}`);
        }
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=LocationService.js.map