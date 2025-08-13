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

// ダミーのハザードマップAPIレスポンスを生成する
router.get('/hazard', (_req, res) => {
  const dummyHazardData = {
    coordinates: {
      latitude: 35.6762,
      longitude: 139.6503,
    },
    source: "Dummy Hazard API",
    input_type: "latlon",
    hazard_info: {
      jshis_prob_50: { max_prob: 0.85, center_prob: 0.75 },
      jshis_prob_60: { max_prob: 0.65, center_prob: 0.55 },
      inundation_depth: { max_info: "5m以上10m未満", center_info: "3m以上5m未満" },
      flood_keizoku: { max_info: "3日以上7日未満", center_info: "1日以上3日未満" },
      naisui: { max_info: "0.5m以上1.0m未満", center_info: "情報なし" },
      kaokutoukai_hanran: { max_info: "想定区域", center_info: "想定区域" },
      kaokutoukai_kagan: { max_info: "想定区域外", center_info: "想定区域外" },
      tsunami_inundation: { max_info: "1m以上3m未満", center_info: "情報なし" },
      hightide_inundation: { max_info: "0.5m未満", center_info: "情報なし" },
      landslide_hazard: {
        debris_flow: { max_info: "警戒区域", center_info: "情報なし" },
        steep_slope: { max_info: "特別警戒区域", center_info: "警戒区域" },
        landslide: { max_info: "情報なし", center_info: "情報なし" },
      },
      avalanche: { max_info: "雪崩危険箇所", center_info: "情報なし" },
      large_fill_land: { max_info: "あり", center_info: "あり" },
    },
    status: "success",
  };
  res.json(dummyHazardData);
});

export default router;