import { Request, Response, NextFunction } from 'express';
import { LocationService } from '../services/LocationService';
import { validateLocationInput } from '../utils/inputValidation';
import { InvalidInputError, LocationNotFoundError, GeolocationError } from '../services/LocationService';

/**
 * 位置情報解決APIのリクエストボディ型定義
 */
interface LocationResolveRequest {
  type: 'address' | 'coordinates' | 'geolocation';
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
}

/**
 * 位置情報解決APIのレスポンス型定義
 */
interface LocationResolveResponse {
  success: boolean;
  data?: {
    latitude: number;
    longitude: number;
    address?: string;
    source: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 位置情報解決コントローラー
 */
export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * POST /api/location/resolve
   * 位置情報解決エンドポイント
   */
  async resolveLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestBody: LocationResolveRequest = req.body;

      // 基本的なtypeフィールドのチェック
      if (!requestBody.type) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'typeフィールドは必須です'
          }
        } as LocationResolveResponse);
        return;
      }

      // 有効なtypeかチェック
      const validTypes = ['address', 'coordinates', 'geolocation'];
      if (!validTypes.includes(requestBody.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: '無効な入力タイプです'
          }
        } as LocationResolveResponse);
        return;
      }

      let coordinates;

      // 入力タイプ別の処理
      switch (requestBody.type) {
        case 'address':
          if (!requestBody.address) {
            res.status(400).json({
              success: false,
              error: {
                code: 'MISSING_ADDRESS',
                message: '住所が指定されていません'
              }
            } as LocationResolveResponse);
            return;
          }
          coordinates = await this.locationService.resolveAddress(requestBody.address);
          break;

        case 'coordinates':
          if (requestBody.latitude === undefined || requestBody.longitude === undefined) {
            res.status(400).json({
              success: false,
              error: {
                code: 'MISSING_COORDINATES',
                message: '緯度と経度が指定されていません'
              }
            } as LocationResolveResponse);
            return;
          }
          coordinates = await this.locationService.parseCoordinates(
            String(requestBody.latitude),
            String(requestBody.longitude)
          );
          break;



        case 'geolocation':
          if (requestBody.latitude === undefined || requestBody.longitude === undefined) {
            res.status(400).json({
              success: false,
              error: {
                code: 'MISSING_COORDINATES',
                message: '現在地の緯度と経度が指定されていません'
              }
            } as LocationResolveResponse);
            return;
          }
          coordinates = await this.locationService.processGeolocationCoordinates(
            Number(requestBody.latitude),
            Number(requestBody.longitude)
          );
          break;

        default:
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_TYPE',
              message: '無効な入力タイプです'
            }
          } as LocationResolveResponse);
          return;
      }

      // 成功レスポンス
      res.status(200).json({
        success: true,
        data: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: coordinates.address,
          source: coordinates.source
        }
      } as LocationResolveResponse);

    } catch (error) {
      // エラータイプ別の処理
      if (error instanceof InvalidInputError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: error.message
          }
        } as LocationResolveResponse);
        return;
      }

      if (error instanceof LocationNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LOCATION_NOT_FOUND',
            message: error.message
          }
        } as LocationResolveResponse);
        return;
      }



      if (error instanceof GeolocationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'GEOLOCATION_ERROR',
            message: error.message
          }
        } as LocationResolveResponse);
        return;
      }

      // その他のエラーは次のミドルウェアに渡す
      next(error);
    }
  }
}