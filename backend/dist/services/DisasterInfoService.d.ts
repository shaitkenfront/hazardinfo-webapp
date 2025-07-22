import { AxiosInstance } from 'axios';
import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../types';
/**
 * 外部API呼び出しエラー
 */
export declare class ExternalAPIError extends Error {
    readonly statusCode?: number | undefined;
    readonly apiName?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, apiName?: string | undefined);
}
/**
 * 防災情報サービスのインターフェース
 */
export interface IDisasterInfoService {
    getHazardMapInfo(coordinates: Coordinates): Promise<HazardInfo[]>;
    getEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]>;
    getDisasterHistory(coordinates: Coordinates): Promise<DisasterEvent[]>;
    getWeatherAlerts(coordinates: Coordinates): Promise<WeatherAlert[]>;
}
/**
 * 防災情報取得サービス
 */
export declare class DisasterInfoService implements IDisasterInfoService {
    private httpClient;
    constructor();
    /**
     * ハザードマップ情報を取得
     */
    getHazardMapInfo(coordinates: Coordinates): Promise<HazardInfo[]>;
    /**
     * 避難所情報を取得
     */
    getEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]>;
    /**
     * 災害履歴情報を取得
     */
    getDisasterHistory(coordinates: Coordinates): Promise<DisasterEvent[]>;
    /**
     * 気象警報情報を取得
     */
    getWeatherAlerts(coordinates: Coordinates): Promise<WeatherAlert[]>;
    /**
     * HTTPクライアントを取得（テスト用）
     */
    getHttpClient(): AxiosInstance;
}
//# sourceMappingURL=DisasterInfoService.d.ts.map