import { Router } from 'express';
import { LocationController } from '../controllers/LocationController';

const router = Router();
const locationController = new LocationController();

/**
 * POST /api/location/resolve
 * 位置情報解決エンドポイント
 * 
 * リクエストボディ:
 * {
 *   type: 'address' | 'coordinates' | 'geolocation',
 *   address?: string,
 *   latitude?: string | number,
 *   longitude?: string | number
 * }
 * 
 * レスポンス:
 * {
 *   success: boolean,
 *   data?: {
 *     latitude: number,
 *     longitude: number,
 *     address?: string,
 *     source: string
 *   },
 *   error?: {
 *     code: string,
 *     message: string
 *   }
 * }
 */
router.post('/resolve', locationController.resolveLocation.bind(locationController));

export default router;