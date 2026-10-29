import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { seedDemoDataIfEmpty } from './server/auth.ts';
import { authRouter } from './server/routes/authRoutes.ts';
import { taskRouter } from './server/routes/taskRoutes.ts';
import { habitRouter } from './server/routes/habitRoutes.ts';
import { gamificationRouter } from './server/routes/gamificationRoutes.ts';
import { analyticsRouter } from './server/routes/analyticsRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize and seed demo data if DB is fresh
  seedDemoDataIfEmpty();

  // Middleware
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/habits', habitRouter);
  app.use('/api/gamification', gamificationRouter);
  app.use('/api/analytics', analyticsRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ AuraHabit server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
