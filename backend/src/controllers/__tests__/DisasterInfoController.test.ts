import request from 'supertest';
import express from 'express';
import { DisasterInfoController } from '../DisasterInfoController';
import disasterInfoRoutes from '../../routes/disasterInfoRoutes';

// テスト用のExpressアプリを作成
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/disaster-info', disasterInfoRoutes);
  
  // エラーハンドリングミドルウェア
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

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/disaster-info/:lat/:lng', () => {
    
    describe('正常なケース', () => {
      it('有効な座標で防災情報を取得できる', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('coordinates');
        expect(response.body.data).toHaveProperty('hazardInfo');
        expect(response.body.data).toHaveProperty('shelters');
        expect(response.body.data).toHaveProperty('disasterHistory');
        expect(response.body.data).toHaveProperty('weatherAlerts');
        expect(response.body.data).toHaveProperty('lastUpdated');
        
        // 座標の確認
        expect(response.body.data.coordinates.latitude).toBe(35.6812);
        expect(response.body.data.coordinates.longitude).toBe(139.7671);
        
        // 配列型の確認
        expect(Array.isArray(response.body.data.hazardInfo)).toBe(true);
        expect(Array.isArray(response.body.data.shelters)).toBe(true);
        expect(Array.isArray(response.body.data.disasterHistory)).toBe(true);
        expect(Array.isArray(response.body.data.weatherAlerts)).toBe(true);
      });

      it('ハザード情報が正しい形式で返される', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        
        if (response.body.data.hazardInfo.length > 0) {
          const hazard = response.body.data.hazardInfo[0];
          expect(hazard).toHaveProperty('type');
          expect(hazard).toHaveProperty('riskLevel');
          expect(hazard).toHaveProperty('description');
          expect(hazard).toHaveProperty('source');
          expect(hazard).toHaveProperty('lastUpdated');
          
          expect(['flood', 'earthquake', 'landslide', 'tsunami', 'large_scale_fill']).toContain(hazard.type);
          expect(['low', 'medium', 'high', 'very_high']).toContain(hazard.riskLevel);
        }
      });

      it('避難所情報が正しい形式で返される', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        expect(response.body.data.shelters.length).toBeGreaterThan(0);
        
        const shelter = response.body.data.shelters[0];
        expect(shelter).toHaveProperty('name');
        expect(shelter).toHaveProperty('address');
        expect(shelter).toHaveProperty('coordinates');
        expect(shelter).toHaveProperty('capacity');
        expect(shelter).toHaveProperty('facilities');
        expect(shelter).toHaveProperty('distance');
        
        expect(typeof shelter.name).toBe('string');
        expect(typeof shelter.address).toBe('string');
        expect(typeof shelter.capacity).toBe('number');
        expect(typeof shelter.distance).toBe('number');
        expect(Array.isArray(shelter.facilities)).toBe(true);
        expect(shelter.coordinates).toHaveProperty('latitude');
        expect(shelter.coordinates).toHaveProperty('longitude');
      });

      it('災害履歴情報が正しい形式で返される', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        
        if (response.body.data.disasterHistory.length > 0) {
          const event = response.body.data.disasterHistory[0];
          expect(event).toHaveProperty('type');
          expect(event).toHaveProperty('date');
          expect(event).toHaveProperty('description');
          expect(event).toHaveProperty('severity');
          expect(event).toHaveProperty('source');
          
          expect(typeof event.type).toBe('string');
          expect(typeof event.description).toBe('string');
          expect(typeof event.severity).toBe('string');
          expect(typeof event.source).toBe('string');
          
          // 日付が有効な形式かチェック
          expect(new Date(event.date)).toBeInstanceOf(Date);
          expect(isNaN(new Date(event.date).getTime())).toBe(false);
        }
      });

      it('避難所が距離順にソートされている', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        
        const shelters = response.body.data.shelters;
        if (shelters.length > 1) {
          for (let i = 1; i < shelters.length; i++) {
            expect(shelters[i].distance).toBeGreaterThanOrEqual(shelters[i - 1].distance);
          }
        }
      });
    });

    describe('エラーケース', () => {
      it('緯度パラメータが欠けている場合エラーを返す', async () => {
        const response = await request(app)
          .get('/api/disaster-info//139.7671');

        expect(response.status).toBe(404); // Express router will return 404 for missing path params
      });

      it('経度パラメータが欠けている場合エラーを返す', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/');

        expect(response.status).toBe(404); // Express router will return 404 for missing path params
      });

      it('無効な緯度でエラーを返す', async () => {
        const response = await request(app)
          .get('/api/disaster-info/invalid/139.7671');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_COORDINATES');
      });

      it('無効な経度でエラーを返す', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/invalid');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_COORDINATES');
      });

      it('日本国外の座標でエラーを返す', async () => {
        const response = await request(app)
          .get('/api/disaster-info/40.7128/-74.0060'); // ニューヨーク

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('COORDINATES_OUT_OF_RANGE');
      });

      it('範囲外の緯度でエラーを返す', async () => {
        const response = await request(app)
          .get('/api/disaster-info/90/139.7671'); // 北極

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('COORDINATES_OUT_OF_RANGE');
      });

      it('範囲外の経度でエラーを返す', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/200'); // 範囲外

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('COORDINATES_OUT_OF_RANGE');
      });
    });

    describe('レスポンス形式の検証', () => {
      it('成功レスポンスが正しい形式である', async () => {
        const response = await request(app)
          .get('/api/disaster-info/35.6812/139.7671');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        
        // lastUpdatedがISO形式の日付文字列かチェック
        expect(typeof response.body.data.lastUpdated).toBe('string');
        expect(new Date(response.body.data.lastUpdated)).toBeInstanceOf(Date);
      });

      it('エラーレスポンスが正しい形式である', async () => {
        const response = await request(app)
          .get('/api/disaster-info/invalid/invalid');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body).not.toHaveProperty('data');
      });
    });
  });

  describe('GET /api/disaster-info/:lat/:lng/hazards', () => {
    it('ハザード情報のみを取得できる', async () => {
      const response = await request(app)
        .get('/api/disaster-info/35.6812/139.7671/hazards');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('coordinates');
      expect(response.body.data).toHaveProperty('hazardInfo');
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(response.body.data).not.toHaveProperty('shelters');
      expect(response.body.data).not.toHaveProperty('disasterHistory');
      expect(response.body.data).not.toHaveProperty('weatherAlerts');
    });

    it('無効な座標でエラーを返す', async () => {
      const response = await request(app)
        .get('/api/disaster-info/invalid/139.7671/hazards');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
    });
  });

  describe('GET /api/disaster-info/:lat/:lng/shelters', () => {
    it('避難所情報のみを取得できる', async () => {
      const response = await request(app)
        .get('/api/disaster-info/35.6812/139.7671/shelters');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('coordinates');
      expect(response.body.data).toHaveProperty('shelters');
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(response.body.data).not.toHaveProperty('hazardInfo');
      expect(response.body.data).not.toHaveProperty('disasterHistory');
      expect(response.body.data).not.toHaveProperty('weatherAlerts');
      
      expect(Array.isArray(response.body.data.shelters)).toBe(true);
      expect(response.body.data.shelters.length).toBeGreaterThan(0);
    });

    it('無効な座標でエラーを返す', async () => {
      const response = await request(app)
        .get('/api/disaster-info/35.6812/invalid/shelters');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
    });
  });

  describe('GET /api/disaster-info/:lat/:lng/history', () => {
    it('災害履歴情報のみを取得できる', async () => {
      const response = await request(app)
        .get('/api/disaster-info/35.6812/139.7671/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('coordinates');
      expect(response.body.data).toHaveProperty('disasterHistory');
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(response.body.data).not.toHaveProperty('hazardInfo');
      expect(response.body.data).not.toHaveProperty('shelters');
      expect(response.body.data).not.toHaveProperty('weatherAlerts');
      
      expect(Array.isArray(response.body.data.disasterHistory)).toBe(true);
    });

    it('災害履歴が日付順（新しい順）にソートされている', async () => {
      const response = await request(app)
        .get('/api/disaster-info/35.6812/139.7671/history');

      expect(response.status).toBe(200);
      
      const history = response.body.data.disasterHistory;
      if (history.length > 1) {
        for (let i = 1; i < history.length; i++) {
          const currentDate = new Date(history[i - 1].date);
          const nextDate = new Date(history[i].date);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });

    it('無効な座標でエラーを返す', async () => {
      const response = await request(app)
        .get('/api/disaster-info/invalid/139.7671/history');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
    });
  });

  describe('パフォーマンステスト', () => {
    it('レスポンス時間が妥当である', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/disaster-info/35.6812/139.7671');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5秒以内
    });

    it('複数の同時リクエストを処理できる', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/api/disaster-info/35.6812/139.7671')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('データ整合性テスト', () => {
    it('同じ座標で複数回リクエストしても一貫した結果が返される', async () => {
      const response1 = await request(app)
        .get('/api/disaster-info/35.6812/139.7671');
      
      const response2 = await request(app)
        .get('/api/disaster-info/35.6812/139.7671');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // ハザード情報の一貫性をチェック
      expect(response1.body.data.hazardInfo).toEqual(response2.body.data.hazardInfo);
      
      // 避難所情報の一貫性をチェック（順序も含めて）
      expect(response1.body.data.shelters).toEqual(response2.body.data.shelters);
      
      // 災害履歴の一貫性をチェック
      expect(response1.body.data.disasterHistory).toEqual(response2.body.data.disasterHistory);
    });

    it('異なる座標では異なる結果が返される', async () => {
      const response1 = await request(app)
        .get('/api/disaster-info/35.6812/139.7671'); // 東京
      
      const response2 = await request(app)
        .get('/api/disaster-info/34.6937/135.5023'); // 大阪

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // 座標が異なることを確認
      expect(response1.body.data.coordinates).not.toEqual(response2.body.data.coordinates);
      
      // 避難所情報が異なることを確認（位置が違うので避難所も違うはず）
      expect(response1.body.data.shelters).not.toEqual(response2.body.data.shelters);
    });
  });
});