import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AlertLogModel } from '../models/AlertLog.js';
import { GameRoundModel } from '../models/GameRound.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(requireAuth);

router.get('/rounds', async (req, res) => {
  const gameUrl = String(req.query.gameUrl ?? '');
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const rounds = await GameRoundModel.find(gameUrl ? { gameUrl } : {}).sort({ endedAt: -1 }).limit(limit).lean();
  res.json(rounds);
});

router.get('/analytics', async (req, res) => {
  const gameUrl = String(req.query.gameUrl ?? '');
  const rounds = await GameRoundModel.find(gameUrl ? { gameUrl } : {}).sort({ endedAt: -1 }).limit(100).lean();
  const multipliers = rounds.map((round) => round.multiplier);
  const avg = multipliers.length ? multipliers.reduce((a, b) => a + b, 0) / multipliers.length : 0;
  const volatility = multipliers.length
    ? Math.sqrt(multipliers.reduce((acc, value) => acc + (value - avg) ** 2, 0) / multipliers.length)
    : 0;

  res.json({
    rounds: rounds.length,
    averageMultiplier: Number(avg.toFixed(3)),
    volatility: Number(volatility.toFixed(3)),
    lowCrashes: multipliers.filter((value) => value < 10).length,
    highCrashes: multipliers.filter((value) => value >= 10).length
  });
});

router.get('/alerts', async (req: AuthRequest, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const alerts = await AlertLogModel.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(alerts);
});

export default router;
