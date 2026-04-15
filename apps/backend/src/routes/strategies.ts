import { Router } from 'express';
import { z } from 'zod';
import { StrategyModel } from '../models/Strategy.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(requireAuth);

const strategyInput = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  cooldownSeconds: z.number().int().min(0).max(86400).default(60),
  conditions: z
    .array(
      z.object({
        type: z.enum(['streak_below', 'streak_above', 'multiplier_below', 'multiplier_above']),
        value: z.number(),
        occurrences: z.number().int().min(1).max(30)
      })
    )
    .min(1),
  alert: z.object({ channel: z.enum(['telegram', 'discord', 'webhook', 'email']) })
});

router.get('/', async (req: AuthRequest, res) => {
  const data = await StrategyModel.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(data);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = strategyInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const created = await StrategyModel.create({ userId: req.userId, ...parsed.data });
  res.status(201).json(created);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const parsed = strategyInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const updated = await StrategyModel.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, parsed.data, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const deleted = await StrategyModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});

export default router;
