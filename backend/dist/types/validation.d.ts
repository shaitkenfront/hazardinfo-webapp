import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from './index';
/**
 * バリデーションエラークラス
 */
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
/**
 * 座標情報のバリデーション
 */
export declare function validateCoordinates(data: any): Coordinates;
/**
 * ハザード情報のバリデーション
 */
export declare function validateHazardInfo(data: any): HazardInfo;
/**
 * 避難所情報のバリデーション
 */
export declare function validateShelter(data: any): Shelter;
/**
 * 災害イベント情報のバリデーション
 */
export declare function validateDisasterEvent(data: any): DisasterEvent;
/**
 * 気象警報情報のバリデーション
 */
export declare function validateWeatherAlert(data: any): WeatherAlert;
//# sourceMappingURL=validation.d.ts.map