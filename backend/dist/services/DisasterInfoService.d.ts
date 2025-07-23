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
     * 洪水ハザード情報を取得
     */
    private getFloodHazardInfo;
    /**
     * 地震ハザード情報を取得
     */
    private getEarthquakeHazardInfo;
    /**
     * 土砂災害ハザード情報を取得
     */
    private getLandslideHazardInfo;
    /**
     * 津波ハザード情報を取得
     */
    private getTsunamiHazardInfo;
    /**
     * 大規模盛土造成地ハザード情報を取得
     */
    private getLargeScaleFillHazardInfo;
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
    /**
     * 洪水リスクレベルを計算
     */
    private calculateFloodRiskLevel;
    /**
     * 地震リスクレベルを計算
     */
    private calculateEarthquakeRiskLevel;
    /**
     * 土砂災害リスクレベルを計算
     */
    private calculateLandslideRiskLevel;
    /**
     * 津波リスクレベルを計算
     */
    private calculateTsunamiRiskLevel;
    /**
     * 大規模盛土造成地リスクレベルを計算
     */
    private calculateLargeScaleFillRiskLevel;
    /**
     * 洪水リスクの説明文を生成
     */
    private getFloodDescription;
    /**
     * 地震リスクの説明文を生成
     */
    private getEarthquakeDescription;
    /**
     * 土砂災害リスクの説明文を生成
     */
    private getLandslideDescription;
    /**
     * 津波リスクの説明文を生成
     */
    private getTsunamiDescription;
    /**
     * 大規模盛土造成地リスクの説明文を生成
     */
    private getLargeScaleFillDescription;
    /**
     * 指定座標周辺の避難所情報を生成
     */
    private generateNearbyEvacuationShelters;
    /**
     * 2点間の距離を計算（ハーバーサイン公式）
     */
    private calculateDistance;
    /**
     * 度をラジアンに変換
     */
    private toRadians;
    /**
     * 避難所の収容人数を生成
     */
    private generateCapacity;
    /**
     * 住所を生成（実際の実装では逆ジオコーディングAPIを使用）
     */
    private generateAddress;
    /**
     * 過去の災害イベント情報を生成
     */
    private generateHistoricalDisasterEvents;
    /**
     * 災害履歴のデータ整理とフィルタリング
     */
    private filterAndOrganizeDisasterHistory;
    /**
     * 重複する災害イベントを除去
     */
    private removeDuplicateEvents;
    /**
     * 重要度に基づいてイベントをフィルタリング
     */
    private filterByImportance;
    /**
     * 災害イベントの説明文を生成
     */
    private generateDisasterEventDescription;
}
//# sourceMappingURL=DisasterInfoService.d.ts.map