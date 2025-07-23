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
export declare class LocationNotFoundError extends Error {
    constructor(message: string);
}
export declare class InvalidInputError extends Error {
    constructor(message: string);
}
export declare class GeolocationError extends Error {
    constructor(message: string);
}
/**
 * 位置情報解決サービスの実装
 */
export declare class LocationService implements ILocationService {
    /**
     * 住所から緯度経度に変換
     * 現在は国土地理院のジオコーディングAPIを使用する想定
     */
    resolveAddress(address: string): Promise<Coordinates>;
    /**
     * 緯度経度文字列を解析
     */
    parseCoordinates(lat: string, lng: string): Promise<Coordinates>;
    /**
     * 現在地を取得（ブラウザのGeolocation API用）
     * 注意: これはフロントエンド側で実装される機能のインターフェース
     * バックエンドでは、フロントエンドから受け取った座標を処理する
     */
    getCurrentLocation(): Promise<Coordinates>;
    /**
     * フロントエンドから受け取った位置情報を処理
     * @param latitude 緯度
     * @param longitude 経度
     * @returns 座標情報
     */
    processGeolocationCoordinates(latitude: number, longitude: number): Promise<Coordinates>;
    /**
     * Google Maps Geocoding APIを呼び出す（プライベートメソッド）
     */
    private callGeocodingAPI;
}
//# sourceMappingURL=LocationService.d.ts.map