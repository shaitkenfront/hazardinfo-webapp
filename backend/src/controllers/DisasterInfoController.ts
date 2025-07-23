import { Request, Response, NextFunction } from 'express';
import { DisasterInfoService, ExternalAPIError } from '../services/DisasterInfoService';
import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../types';

/**
 * 防災情報取得APIのレスポンス型定義
 */
interface DisasterInfoResponse {
  success: boolean;
  data?: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    hazardInfo: HazardInfo[];
    shelters: Shelter[];
    disasterHistory: DisasterEvent[];
    weatherAlerts: WeatherAlert[];
    lastUpdated: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 防災情報コントローラー
 */
export class DisasterInfoController {
  private disasterInfoService: DisasterInfoService;

  constructor() {
    this.disasterInfoService = new DisasterInfoService();
  }

  /**
   * GET /api/disaster-info/:lat/:lng
   * 防災情報取得エンドポイント
   */
  async getDisasterInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng } = req.params;

      // パラメータの基本バリデーション
      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_COORDINATES',
            message: '緯度と経度のパラメータが必要です'
          }
        } as DisasterInfoResponse);
        return;
      }

      // 緯度経度の数値変換とバリデーション
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: '緯度と経度は数値である必要があります'
          }
        } as DisasterInfoResponse);
        return;
      }

      // 日本国内の座標範囲チェック
      if (latitude < 20 || latitude > 46 || longitude < 122 || longitude > 154) {
        res.status(400).json({
          success: false,
          error: {
            code: 'COORDINATES_OUT_OF_RANGE',
            message: '日本国内の座標を指定してください'
          }
        } as DisasterInfoResponse);
        return;
      }

      // 座標オブジェクトを作成
      const coordinates: Coordinates = {
        latitude,
        longitude,
        source: 'coordinates'
      };

      // 各種防災情報を並行取得
      const [hazardInfo, shelters, disasterHistory, weatherAlerts] = await Promise.all([
        this.disasterInfoService.getHazardMapInfo(coordinates),
        this.disasterInfoService.getEvacuationShelters(coordinates),
        this.disasterInfoService.getDisasterHistory(coordinates),
        this.disasterInfoService.getWeatherAlerts(coordinates)
      ]);

      // 成功レスポンス
      res.status(200).json({
        success: true,
        data: {
          coordinates: {
            latitude,
            longitude
          },
          hazardInfo,
          shelters,
          disasterHistory,
          weatherAlerts,
          lastUpdated: new Date().toISOString()
        }
      } as DisasterInfoResponse);

    } catch (error) {
      // エラータイプ別の処理
      if (error instanceof ExternalAPIError) {
        res.status(503).json({
          success: false,
          error: {
            code: 'EXTERNAL_API_ERROR',
            message: `外部APIエラー: ${error.message}`
          }
        } as DisasterInfoResponse);
        return;
      }

      // その他のエラーは次のミドルウェアに渡す
      next(error);
    }
  }

  /**
   * GET /api/disaster-info/:lat/:lng/hazards
   * ハザード情報のみを取得するエンドポイント
   */
  async getHazardInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng } = req.params;

      // パラメータの基本バリデーション
      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_COORDINATES',
            message: '緯度と経度のパラメータが必要です'
          }
        });
        return;
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: '緯度と経度は数値である必要があります'
          }
        });
        return;
      }

      if (latitude < 20 || latitude > 46 || longitude < 122 || longitude > 154) {
        res.status(400).json({
          success: false,
          error: {
            code: 'COORDINATES_OUT_OF_RANGE',
            message: '日本国内の座標を指定してください'
          }
        });
        return;
      }

      const coordinates: Coordinates = {
        latitude,
        longitude,
        source: 'coordinates'
      };

      const hazardInfo = await this.disasterInfoService.getHazardMapInfo(coordinates);

      res.status(200).json({
        success: true,
        data: {
          coordinates: { latitude, longitude },
          hazardInfo,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof ExternalAPIError) {
        res.status(503).json({
          success: false,
          error: {
            code: 'EXTERNAL_API_ERROR',
            message: `外部APIエラー: ${error.message}`
          }
        });
        return;
      }

      next(error);
    }
  }

  /**
   * GET /api/disaster-info/:lat/:lng/shelters
   * 避難所情報のみを取得するエンドポイント
   */
  async getShelters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng } = req.params;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_COORDINATES',
            message: '緯度と経度のパラメータが必要です'
          }
        });
        return;
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: '緯度と経度は数値である必要があります'
          }
        });
        return;
      }

      if (latitude < 20 || latitude > 46 || longitude < 122 || longitude > 154) {
        res.status(400).json({
          success: false,
          error: {
            code: 'COORDINATES_OUT_OF_RANGE',
            message: '日本国内の座標を指定してください'
          }
        });
        return;
      }

      const coordinates: Coordinates = {
        latitude,
        longitude,
        source: 'coordinates'
      };

      const shelters = await this.disasterInfoService.getEvacuationShelters(coordinates);

      res.status(200).json({
        success: true,
        data: {
          coordinates: { latitude, longitude },
          shelters,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof ExternalAPIError) {
        res.status(503).json({
          success: false,
          error: {
            code: 'EXTERNAL_API_ERROR',
            message: `外部APIエラー: ${error.message}`
          }
        });
        return;
      }

      next(error);
    }
  }

  /**
   * GET /api/disaster-info/:lat/:lng/history
   * 災害履歴情報のみを取得するエンドポイント
   */
  async getDisasterHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng } = req.params;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_COORDINATES',
            message: '緯度と経度のパラメータが必要です'
          }
        });
        return;
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: '緯度と経度は数値である必要があります'
          }
        });
        return;
      }

      if (latitude < 20 || latitude > 46 || longitude < 122 || longitude > 154) {
        res.status(400).json({
          success: false,
          error: {
            code: 'COORDINATES_OUT_OF_RANGE',
            message: '日本国内の座標を指定してください'
          }
        });
        return;
      }

      const coordinates: Coordinates = {
        latitude,
        longitude,
        source: 'coordinates'
      };

      const disasterHistory = await this.disasterInfoService.getDisasterHistory(coordinates);

      res.status(200).json({
        success: true,
        data: {
          coordinates: { latitude, longitude },
          disasterHistory,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof ExternalAPIError) {
        res.status(503).json({
          success: false,
          error: {
            code: 'EXTERNAL_API_ERROR',
            message: `外部APIエラー: ${error.message}`
          }
        });
        return;
      }

      next(error);
    }
  }
}