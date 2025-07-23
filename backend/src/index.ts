import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './errors';
import locationRoutes from './routes/locationRoutes';
import disasterInfoRoutes from './routes/disasterInfoRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/location', locationRoutes);
app.use('/api/disaster-info', disasterInfoRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`災害情報アプリ バックエンドサーバーが起動しました: http://localhost:${PORT}`);
});

export default app;