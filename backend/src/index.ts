import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './errors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`災害情報アプリ バックエンドサーバーが起動しました: http://localhost:${PORT}`);
});

export default app;