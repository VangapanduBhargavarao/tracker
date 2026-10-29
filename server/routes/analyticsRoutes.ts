import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../auth.ts';
import { getUserAnalytics } from '../analyticsService.ts';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

// Get user analytics & heatmap data
analyticsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const days = Number(req.query.days) || 60;
  const analytics = getUserAnalytics(user, days);
  res.json({ analytics });
});
