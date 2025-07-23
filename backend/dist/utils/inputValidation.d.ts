/**
 * 入力バリデーション用のクラスとユーティリティ関数
 */
export declare class InputValidationError extends Error {
    inputType?: string | undefined;
    constructor(message: string, inputType?: string | undefined);
}
/**
 * 住所バリデーションクラス
 */
export declare class AddressValidator {
    private static readonly MIN_LENGTH;
    private static readonly MAX_LENGTH;
    private static readonly PREFECTURES;
    /**
     * 住所の基本的な形式をバリデーション
     */
    static validate(address: string): boolean;
    /**
     * 日本の住所として妥当かチェック
     */
    private static isJapaneseAddress;
    /**
     * 住所を正規化（トリム、全角数字を半角に変換など）
     */
    static normalize(address: string): string;
}
/**
 * 緯度経度バリデーションクラス
 */
export declare class CoordinatesValidator {
    /**
     * 緯度経度の文字列をバリデーション
     */
    static validate(lat: string, lng: string): {
        latitude: number;
        longitude: number;
    };
    /**
     * 緯度のバリデーション
     */
    private static validateLatitude;
    /**
     * 経度のバリデーション
     */
    private static validateLongitude;
    /**
     * 日本国内の座標かチェック
     */
    private static isWithinJapan;
    /**
     * 座標文字列を正規化
     */
    static normalize(coordinate: string): string;
}
/**
 * SUUMO URLバリデーションクラス
 */
export declare class SuumoUrlValidator {
    private static readonly SUUMO_DOMAINS;
    private static readonly VALID_PATH_PATTERNS;
    /**
     * SUUMO URLをバリデーション
     */
    static validate(url: string): boolean;
    /**
     * SUUMOの有効なパスかチェック
     */
    private static isValidSuumoPath;
    /**
     * SUUMO URLを正規化
     */
    static normalize(url: string): string;
    /**
     * SUUMO URLから物件IDを抽出
     */
    static extractPropertyId(url: string): string | null;
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
    type: 'address' | 'coordinates' | 'suumo' | 'geolocation';
    address?: string;
    latitude?: string | number;
    longitude?: string | number;
    url?: string;
}
/**
 * 位置情報解決APIのリクエストをバリデーション
 */
export declare function validateLocationInput(request: LocationResolveRequest): LocationInputValidationResult;
//# sourceMappingURL=inputValidation.d.ts.map