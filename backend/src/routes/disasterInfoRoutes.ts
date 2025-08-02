import { Router } from 'express';
import { DisasterInfoController } from '../controllers/DisasterInfoController';

const router = Router();
const disasterInfoController = new DisasterInfoController();

/**
 * GET /api/disaster-info/:lat/:lng
 * 防災情報統合取得エンドポイント
 * 
 * パラメータ:
 * - lat: 緯度 (number)
 * - lng: 経度 (number)
 * 
 * レスポンス:
 * {
 *   success: boolean,
 *   data?: {
 *     coordinates: { latitude: number, longitude: number },
 *     hazardInfo: HazardInfo[],
 *     shelters: Shelter[],
 *     disasterHistory: DisasterEvent[],
 *     weatherAlerts: WeatherAlert[],
 *     lastUpdated: string
 *   },
 *   error?: {
 *     code: string,
 *     message: string
 *   }
 * }
 */
router.get('/:lat/:lng', disasterInfoController.getDisasterInfo.bind(disasterInfoController));

/**
 * GET /api/disaster-info/:lat/:lng/hazards
 * ハザード情報のみを取得するエンドポイント
 */
router.get('/:lat/:lng/hazards', disasterInfoController.getHazardInfo.bind(disasterInfoController));

/**
 * GET /api/disaster-info/:lat/:lng/shelters
 * 避難所情報のみを取得するエンドポイント
 */
router.get('/:lat/:lng/shelters', disasterInfoController.getShelters.bind(disasterInfoController));

/**
 * GET /api/disaster-info/:lat/:lng/history
 * 災害履歴情報のみを取得するエンドポイント
 */
router.get('/:lat/:lng/history', disasterInfoController.getDisasterHistory.bind(disasterInfoController));

export default router;