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
        // 基本実装 - 後続のタスクで詳細実装
        try {
            // TODO: 実際の外部API呼び出しを実装
            return [];
        }
        catch (error) {
            if (error instanceof ExternalAPIError) {
                throw error;
            }
            throw new ExternalAPIError(`Failed to fetch hazard map info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, 'hazard-map-api');
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
}
exports.DisasterInfoService = DisasterInfoService;
//# sourceMappingURL=DisasterInfoService.js.map