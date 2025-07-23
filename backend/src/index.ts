import express from 'express';
import cors from 'cors';
import path from 'path';

import { errorHandler, notFoundHandler } from './errors';
import locationRoutes from './routes/locationRoutes';
import disasterInfoRoutes from './routes/disasterInfoRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

/* ========= ミドルウェア ========= */
app.use(cors());
app.use(express.json());

/* ========= ヘルスチェック ========= */
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/* ========= API ルート ========= */
app.use('/api/location', locationRoutes);
app.use('/api/disaster-info', disasterInfoRoutes);

/* ========= フロントエンド配信 ========= */
// Vite ビルド成果物のパス
// src/index.ts → dist/index.js に変換される想定なので、
// dist から見て ../../frontend/dist がフロントの成果物ディレクトリ
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

// 静的ファイル (JS/CSS/画像など) を配信
app.use(express.static(frontendDistPath));

/* SPA ルーティング対応
   /api で始まらない任意の GET リクエストはすべて index.html を返す */
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

/* ========= 404 / エラーハンドラ ========= */
app.use(notFoundHandler);
app.use(errorHandler);

/* ========= サーバー起動 ========= */
app.listen(PORT, () => {
  console.log(`災害情報アプリ バックエンドサーバーが起動しました: http://localhost:${PORT}`);
});

export default app;
