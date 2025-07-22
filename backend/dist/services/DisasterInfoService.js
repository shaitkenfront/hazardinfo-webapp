"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisasterInfoService = exports.ExternalAPIError = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * 外部API呼び出しエラー
 */
class ExternalAPIError extends Error {
    constructor(message, statusCode, apiName) {
        super(message);
        this.statusCode = statusCode;
        this.apiName = apiName;
        this.name = 'ExternalAPIError';
    }
}
exports.ExternalAPIError = ExternalAPIError;
/**
 * 防災情報取得サービス
 */
class DisasterInfoService {
    constructor() {
        this.httpClient = axios_1.default.create({
            timeout: 10000, // 10秒のタイムアウト
            headers: {
                'User-Agent': 'DisasterInfoApp/1.0',
                'Accept': 'application/json',
            },
        });
        // レスポンスインターセプターでエラーハンドリング
        this.httpClient.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                // サーバーからエラーレスポンスが返された場合
                throw new ExternalAPIError(`API request failed: ${error.response.status} ${error.response.statusText}`, error.response.status, error.config?.baseURL || 'unknown');
            }
            else if (error.request) {
                // リクエストが送信されたが、レスポンスが受信されなかった場合
                throw new ExternalAPIError('No response received from API', undefined, error.config?.baseURL || 'unknown');
            }
            else {
                // リクエスト設定中にエラーが発生した場合
                throw new ExternalAPIError(`Request setup error: ${error.message}`, undefined, 'unknown');
            }
        });
    }
    /**
     * ハザードマップ情報を取得
     */
    async getHazardMapInfo(coordinates) {
        try {
            const hazardInfos = [];
            // 洪水リスク情報を取得
            const floodInfo = await this.getFloodHazardInfo(coordinates);
            if (floodInfo)
                hazardInfos.push(floodInfo);
            // 地震リスク情報を取得
            const earthquakeInfo = await this.getEarthquakeHazardInfo(coordinates);
            if (earthquakeInfo)
                hazardInfos.push(earthquakeInfo);
            // 土砂災害リスク情報を取得
            const landslideInfo = await this.getLandslideHazardInfo(coordinates);
            if (landslideInfo)
                hazardInfos.push(landslideInfo);
            // 津波リスク情報を取得
            const tsunamiInfo = await this.getTsunamiHazardInfo(coordinates);
            if (tsunamiInfo)
                hazardInfos.push(tsunamiInfo);
            // 大規模盛土造成地リスク情報を取得
            const largeFillInfo = await this.getLargeScaleFillHazardInfo(coordinates);
            if (largeFillInfo)
                hazardInfos.push(largeFillInfo);
            return hazardInfos;
        }
        catch (error) {
            if (error instanceof ExternalAPIError) {
                throw error;
            }
            throw new ExternalAPIError(`Failed to fetch hazard map info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'hazard-map-api');
        }
    }
    /**
     * 洪水ハザード情報を取得
     */
    async getFloodHazardInfo(coordinates) {
        try {
            // 実際の実装では国土交通省のハザードマップAPIを呼び出す
            // ここではモック実装として座標に基づいてリスクレベルを算出
            const riskLevel = this.calculateFloodRiskLevel(coordinates);
            if (riskLevel === 'low') {
                return null; // リスクが低い場合は情報を返さない
            }
            return {
                type: 'flood',
                riskLevel,
                description: this.getFloodDescription(riskLevel),
                source: '国土交通省ハザードマップポータルサイト',
                lastUpdated: new Date('2024-01-15'),
                detailUrl: 'https://disaportal.gsi.go.jp/'
            };
        }
        catch (error) {
            throw new ExternalAPIError(`Failed to fetch flood hazard info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'flood-hazard-api');
        }
    }
    /**
     * 地震ハザード情報を取得
     */
    async getEarthquakeHazardInfo(coordinates) {
        try {
            const riskLevel = this.calculateEarthquakeRiskLevel(coordinates);
            if (riskLevel === 'low') {
                return null;
            }
            return {
                type: 'earthquake',
                riskLevel,
                description: this.getEarthquakeDescription(riskLevel),
                source: '地震調査研究推進本部',
                lastUpdated: new Date('2024-01-10'),
                detailUrl: 'https://www.jishin.go.jp/'
            };
        }
        catch (error) {
            throw new ExternalAPIError(`Failed to fetch earthquake hazard info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'earthquake-hazard-api');
        }
    }
    /**
     * 土砂災害ハザード情報を取得
     */
    async getLandslideHazardInfo(coordinates) {
        try {
            const riskLevel = this.calculateLandslideRiskLevel(coordinates);
            if (riskLevel === 'low') {
                return null;
            }
            return {
                type: 'landslide',
                riskLevel,
                description: this.getLandslideDescription(riskLevel),
                source: '国土交通省砂防部',
                lastUpdated: new Date('2024-01-20'),
                detailUrl: 'https://www.mlit.go.jp/river/sabo/'
            };
        }
        catch (error) {
            throw new ExternalAPIError(`Failed to fetch landslide hazard info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'landslide-hazard-api');
        }
    }
    /**
     * 津波ハザード情報を取得
     */
    async getTsunamiHazardInfo(coordinates) {
        try {
            const riskLevel = this.calculateTsunamiRiskLevel(coordinates);
            if (riskLevel === 'low') {
                return null;
            }
            return {
                type: 'tsunami',
                riskLevel,
                description: this.getTsunamiDescription(riskLevel),
                source: '気象庁',
                lastUpdated: new Date('2024-01-12'),
                detailUrl: 'https://www.jma.go.jp/jma/kishou/know/tsunami/'
            };
        }
        catch (error) {
            throw new ExternalAPIError(`Failed to fetch tsunami hazard info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'tsunami-hazard-api');
        }
    }
    /**
     * 大規模盛土造成地ハザード情報を取得
     */
    async getLargeScaleFillHazardInfo(coordinates) {
        try {
            const riskLevel = this.calculateLargeScaleFillRiskLevel(coordinates);
            if (riskLevel === 'low') {
                return null;
            }
            return {
                type: 'large_scale_fill',
                riskLevel,
                description: this.getLargeScaleFillDescription(riskLevel),
                source: '国土交通省都市局',
                lastUpdated: new Date('2024-01-08'),
                detailUrl: 'https://www.mlit.go.jp/toshi/web/toshi_tobou_tk_000035.html'
            };
        }
        catch (error) {
            throw new ExternalAPIError(`Failed to fetch large scale fill hazard info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'large-scale-fill-hazard-api');
        }
    }
    /**
     * 避難所情報を取得
     */
    async getEvacuationShelters(coordinates) {
        // 基本実装 - 後続のタスクで詳細実装
        try {
            // TODO: 実際の外部API呼び出しを実装
            return [];
        }
        catch (error) {
            if (error instanceof ExternalAPIError) {
                throw error;
            }
            throw new ExternalAPIError(`Failed to fetch evacuation shelters: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'shelter-api');
        }
    }
    /**
     * 災害履歴情報を取得
     */
    async getDisasterHistory(coordinates) {
        // 基本実装 - 後続のタスクで詳細実装
        try {
            // TODO: 実際の外部API呼び出しを実装
            return [];
        }
        catch (error) {
            if (error instanceof ExternalAPIError) {
                throw error;
            }
            throw new ExternalAPIError(`Failed to fetch disaster history: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'disaster-history-api');
        }
    }
    /**
     * 気象警報情報を取得
     */
    async getWeatherAlerts(coordinates) {
        // 基本実装 - 後続のタスクで詳細実装
        try {
            // TODO: 実際の外部API呼び出しを実装
            return [];
        }
        catch (error) {
            if (error instanceof ExternalAPIError) {
                throw error;
            }
            throw new ExternalAPIError(`Failed to fetch weather alerts: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'weather-api');
        }
    }
    /**
     * HTTPクライアントを取得（テスト用）
     */
    getHttpClient() {
        return this.httpClient;
    }
    // リスクレベル計算メソッド
    /**
     * 洪水リスクレベルを計算
     */
    calculateFloodRiskLevel(coordinates) {
        // 実際の実装では地形データや過去の洪水履歴を参照
        // ここでは座標に基づく簡易的な計算
        const { latitude, longitude } = coordinates;
        // 河川に近い地域や低地をシミュレート
        const riverProximity = Math.abs(Math.sin(latitude * 100) * Math.cos(longitude * 100));
        const elevation = Math.abs(Math.sin(latitude * 50) * Math.cos(longitude * 50));
        const riskScore = riverProximity * 0.7 + (1 - elevation) * 0.3;
        if (riskScore > 0.8)
            return 'very_high';
        if (riskScore > 0.6)
            return 'high';
        if (riskScore > 0.4)
            return 'medium';
        return 'low';
    }
    /**
     * 地震リスクレベルを計算
     */
    calculateEarthquakeRiskLevel(coordinates) {
        const { latitude, longitude } = coordinates;
        // 活断層や地盤の強度をシミュレート
        const faultProximity = Math.abs(Math.sin(latitude * 80) * Math.cos(longitude * 80));
        const groundStrength = Math.abs(Math.cos(latitude * 60) * Math.sin(longitude * 60));
        const riskScore = faultProximity * 0.6 + (1 - groundStrength) * 0.4;
        if (riskScore > 0.75)
            return 'very_high';
        if (riskScore > 0.55)
            return 'high';
        if (riskScore > 0.35)
            return 'medium';
        return 'low';
    }
    /**
     * 土砂災害リスクレベルを計算
     */
    calculateLandslideRiskLevel(coordinates) {
        const { latitude, longitude } = coordinates;
        // 傾斜地や地質をシミュレート
        const slope = Math.abs(Math.sin(latitude * 120) * Math.cos(longitude * 120));
        const geology = Math.abs(Math.cos(latitude * 90) * Math.sin(longitude * 90));
        const riskScore = slope * 0.8 + geology * 0.2;
        if (riskScore > 0.85)
            return 'very_high';
        if (riskScore > 0.65)
            return 'high';
        if (riskScore > 0.45)
            return 'medium';
        return 'low';
    }
    /**
     * 津波リスクレベルを計算
     */
    calculateTsunamiRiskLevel(coordinates) {
        const { latitude, longitude } = coordinates;
        // 海岸からの距離と標高をシミュレート
        const coastalDistance = Math.abs(Math.sin(latitude * 70) * Math.cos(longitude * 70));
        const elevation = Math.abs(Math.cos(latitude * 40) * Math.sin(longitude * 40));
        const riskScore = (1 - coastalDistance) * 0.7 + (1 - elevation) * 0.3;
        if (riskScore > 0.8)
            return 'very_high';
        if (riskScore > 0.6)
            return 'high';
        if (riskScore > 0.4)
            return 'medium';
        return 'low';
    }
    /**
     * 大規模盛土造成地リスクレベルを計算
     */
    calculateLargeScaleFillRiskLevel(coordinates) {
        const { latitude, longitude } = coordinates;
        // 造成地の可能性をシミュレート
        const developmentDensity = Math.abs(Math.sin(latitude * 110) * Math.cos(longitude * 110));
        const terrainModification = Math.abs(Math.cos(latitude * 85) * Math.sin(longitude * 85));
        const riskScore = developmentDensity * 0.6 + terrainModification * 0.4;
        if (riskScore > 0.9)
            return 'very_high';
        if (riskScore > 0.7)
            return 'high';
        if (riskScore > 0.5)
            return 'medium';
        return 'low';
    }
    // 説明文生成メソッド
    /**
     * 洪水リスクの説明文を生成
     */
    getFloodDescription(riskLevel) {
        switch (riskLevel) {
            case 'medium':
                return '中程度の洪水リスクがあります。大雨時には注意が必要です。';
            case 'high':
                return '高い洪水リスクがあります。避難経路を事前に確認しておくことをお勧めします。';
            case 'very_high':
                return '非常に高い洪水リスクがあります。浸水想定区域に指定されている可能性があります。';
        }
    }
    /**
     * 地震リスクの説明文を生成
     */
    getEarthquakeDescription(riskLevel) {
        switch (riskLevel) {
            case 'medium':
                return '中程度の地震リスクがあります。建物の耐震性を確認することをお勧めします。';
            case 'high':
                return '高い地震リスクがあります。活断層や軟弱地盤の影響を受ける可能性があります。';
            case 'very_high':
                return '非常に高い地震リスクがあります。強い揺れが予想される地域です。';
        }
    }
    /**
     * 土砂災害リスクの説明文を生成
     */
    getLandslideDescription(riskLevel) {
        switch (riskLevel) {
            case 'medium':
                return '中程度の土砂災害リスクがあります。大雨時には周辺の状況に注意してください。';
            case 'high':
                return '高い土砂災害リスクがあります。土砂災害警戒区域に指定されている可能性があります。';
            case 'very_high':
                return '非常に高い土砂災害リスクがあります。土砂災害特別警戒区域に指定されている可能性があります。';
        }
    }
    /**
     * 津波リスクの説明文を生成
     */
    getTsunamiDescription(riskLevel) {
        switch (riskLevel) {
            case 'medium':
                return '中程度の津波リスクがあります。海岸からの距離や標高を確認してください。';
            case 'high':
                return '高い津波リスクがあります。津波浸水想定区域に含まれる可能性があります。';
            case 'very_high':
                return '非常に高い津波リスクがあります。津波到達時間が短い地域の可能性があります。';
        }
    }
    /**
     * 大規模盛土造成地リスクの説明文を生成
     */
    getLargeScaleFillDescription(riskLevel) {
        switch (riskLevel) {
            case 'medium':
                return '中程度の大規模盛土造成地リスクがあります。地盤の安定性に注意が必要です。';
            case 'high':
                return '高い大規模盛土造成地リスクがあります。大規模盛土造成地マップで確認することをお勧めします。';
            case 'very_high':
                return '非常に高い大規模盛土造成地リスクがあります。地震時の地盤変動に特に注意が必要です。';
        }
    }
}
exports.DisasterInfoService = DisasterInfoService;
//# sourceMappingURL=DisasterInfoService.js.map