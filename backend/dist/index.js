"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errors_1 = require("./errors");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// 404 handler (must be after all routes)
app.use(errors_1.notFoundHandler);
// Error handling middleware (must be last)
app.use(errors_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`災害情報アプリ バックエンドサーバーが起動しました: http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map