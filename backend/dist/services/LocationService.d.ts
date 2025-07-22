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
export declare class LocationNotFoundError extends Error {
    constructor(message: string);
}
export declare class InvalidInputError extends Error {
    constructor(message: string);
}
export declare class SuumoParsingError extends Error {
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
     * SUUMO URLから位置情報を抽出
     */
    extractLocationFromSuumo(url: string): Promise<Coordinates>;
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
     * 国土地理院ジオコーディングAPIを呼び出す（プライベートメソッド）
     */
    private callGeocodingAPI;
    /**
     * SUUMO URLの妥当性をチェック
     */
    private isValidSuumoUrl;
    /**
     * SUUMO URLを解析して位置情報を取得
     */
    private parseSuumoUrl;
    /**
     * 賃貸物件URLを解析
     */
    private parseChintaiUrl;
    /**
     * 分譲マンションURLを解析
     */
    private parseMansionUrl;
    /**
     * 新築一戸建てURLを解析
     */
    private parseIkkodateUrl;
    /**
     * 中古一戸建てURLを解析
     */
    private parseChukoIkkodateUrl;
    /**
     * 土地URLを解析
     */
    private parseTochiUrl;
}
//# sourceMappingURL=LocationService.d.ts.map