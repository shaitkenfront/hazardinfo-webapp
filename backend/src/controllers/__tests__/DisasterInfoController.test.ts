import request from 'supertest';
import express from 'express';
import disasterInfoRoutes from '../../routes/disasterInfoRoutes';
import { DisasterInfoService } from '../../services/DisasterInfoService';

// DisasterInfoServiceをモック化
jest.mock('../../services/DisasterInfoService');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/disaster-info', disasterInfoRoutes);
  
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'Internal server error'
      }
    });
  });
  
  return app;
};

describe('DisasterInfoController Integration Tests', () => {
  let app: express.Application;
  let mockGetHazardMapInfo: jest.SpyInstance;
  let mockGetEvacuationShelters: jest.SpyInstance;
  let mockGetDisasterHistory: jest.SpyInstance;

  beforeEach(() => {
    app = createTestApp();
    // モックされたメソッドをスパイ
    mockGetHazardMapInfo = jest.spyOn(DisasterInfoService.prototype, 'getHazardMapInfo');
    mockGetEvacuationShelters = jest.spyOn(DisasterInfoService.prototype, 'getEvacuationShelters');
    mockGetDisasterHistory = jest.spyOn(DisasterInfoService.prototype, 'getDisasterHistory');
  });

  afterEach(() => {
    // 各テスト後にモックをクリア
    mockGetHazardMapInfo.mockRestore();
    mockGetEvacuationShelters.mockRestore();
    mockGetDisasterHistory.mockRestore();
  });

  describe('GET /api/disaster-info/:lat/:lng', () => {
    
    describe('正常なケース', () => {
      it('有効な座標で防災情報を取得できる', async () => {
        // モックの戻り値を設定
        const mockHazardData = [];
        const mockShelterData = [];
        const mockHistoryData = [];

        mockGetHazardMapInfo.mockResolvedValue(mockHazardData);
        mockGetEvacuationShelters.mockResolvedValue(mockShelterData);
        mockGetDisasterHistory.mockResolvedValue(mockHistoryData);

        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockGetHazardMapInfo).toHaveBeenCalledWith({ latitude: 35.6812, longitude: 139.7671, source: 'coordinates' });
        expect(mockGetEvacuationShelters).toHaveBeenCalledWith({ latitude: 35.6812, longitude: 139.7671, source: 'coordinates' });
        expect(mockGetDisasterHistory).toHaveBeenCalledWith({ latitude: 35.6812, longitude: 139.7671, source: 'coordinates' });
      });

      it('ハザード情報が正しい形式で返される', async () => {
        const mockHazardData = [{
          type: 'flood',
          riskLevel: 'high',
          description: 'Test flood risk',
          source: 'Test source',
          lastUpdated: new Date()
        }];
        mockGetHazardMapInfo.mockResolvedValue(mockHazardData);
        mockGetEvacuationShelters.mockResolvedValue([]);
        mockGetDisasterHistory.mockResolvedValue([]);
        
        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        expect(response.body.data.hazardInfo[0].type).toBe('flood');
      });
    });

    describe('エラーケース', () => {
      it('サービスレイヤーでエラーが発生した場合、500エラーを返す', async () => {
        mockGetHazardMapInfo.mockRejectedValue(new Error('Internal Service Error'));
        mockGetEvacuationShelters.mockResolvedValue([]);
        mockGetDisasterHistory.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('Internal Service Error');
      });
    });
  });
});