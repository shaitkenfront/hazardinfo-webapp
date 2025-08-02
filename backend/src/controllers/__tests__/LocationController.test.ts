import request from 'supertest';
import express from 'express';
import { LocationController } from '../LocationController';
import locationRoutes from '../../routes/locationRoutes';

// テスト用のExpressアプリを作成
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/location', locationRoutes);
  
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

describe('LocationController Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/location/resolve', () => {
    
    describe('住所による位置情報解決', () => {
      it.skip('有効な住所で位置情報を取得できる（Google Maps API統合テスト）', async () => {
        // このテストは実際のAPIキーが必要なため、統合テストではスキップ
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'address',
            address: '東京都千代田区丸の内1-1-1'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('latitude');
        expect(response.body.data).toHaveProperty('longitude');
        expect(response.body.data.source).toBe('address');
        expect(typeof response.body.data.latitude).toBe('number');
        expect(typeof response.body.data.longitude).toBe('number');
      });

      it('無効な住所でエラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'address',
            address: 'invalid address'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('LOCATION_NOT_FOUND');
      });

      it('住所が空の場合エラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'address',
            address: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_ADDRESS');
      });

      it('住所フィールドが欠けている場合エラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'address'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_ADDRESS');
      });
    });

    describe('緯度経度による位置情報解決', () => {
      it('有効な緯度経度で位置情報を取得できる', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'coordinates',
            latitude: '35.6812',
            longitude: '139.7671'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.latitude).toBe(35.6812);
        expect(response.body.data.longitude).toBe(139.7671);
        expect(response.body.data.source).toBe('coordinates');
      });

      it('数値型の緯度経度でも正常に処理できる', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'coordinates',
            latitude: 35.6812,
            longitude: 139.7671
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.latitude).toBe(35.6812);
        expect(response.body.data.longitude).toBe(139.7671);
      });

      it('日本国外の座標でエラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'coordinates',
            latitude: '40.7128', // ニューヨーク
            longitude: '-74.0060'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_INPUT');
      });

      it('無効な緯度経度でエラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'coordinates',
            latitude: 'invalid',
            longitude: 'invalid'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_INPUT');
      });

      it('緯度経度フィールドが欠けている場合エラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'coordinates',
            latitude: '35.6812'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_COORDINATES');
      });
    });

    // SUUMO URLによる位置情報解決テストは削除（機能が削除されたため）

    describe('現在地による位置情報解決', () => {
      it('有効な現在地座標で位置情報を取得できる', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'geolocation',
            latitude: 35.6812,
            longitude: 139.7671
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.latitude).toBe(35.6812);
        expect(response.body.data.longitude).toBe(139.7671);
        expect(response.body.data.source).toBe('geolocation');
      });

      it('日本国外の現在地座標でエラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'geolocation',
            latitude: 40.7128, // ニューヨーク
            longitude: -74.0060
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_INPUT');
      });

      it('現在地座標フィールドが欠けている場合エラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'geolocation',
            latitude: 35.6812
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_COORDINATES');
      });
    });

    describe('共通のバリデーション', () => {
      it('typeフィールドが欠けている場合エラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            address: '東京都千代田区'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_INPUT');
      });

      it('無効なtypeでエラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'invalid_type',
            address: '東京都千代田区'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TYPE');
      });

      it('空のリクエストボディでエラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_INPUT');
      });

      it('Content-Typeがapplication/jsonでない場合エラーを返す', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .set('Content-Type', 'text/plain')
          .send('invalid data');

        expect(response.status).toBe(400);
      });
    });

    describe('レスポンス形式の検証', () => {
      it('成功レスポンスが正しい形式である', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'coordinates',
            latitude: '35.6812',
            longitude: '139.7671'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('latitude');
        expect(response.body.data).toHaveProperty('longitude');
        expect(response.body.data).toHaveProperty('source');
        expect(response.body).not.toHaveProperty('error');
      });

      it('エラーレスポンスが正しい形式である', async () => {
        const response = await request(app)
          .post('/api/location/resolve')
          .send({
            type: 'address'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body).not.toHaveProperty('data');
      });
    });
  });
});