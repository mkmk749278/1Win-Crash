import { StrategyModel } from '../models/Strategy.js';
import { AlertService } from './alertService.js';

export interface RoundSummary {
  gameUrl: string;
  roundId: string;
  multiplier: number;
  streakBelow10: number;
  streakAbove10: number;
}

export const evaluateCondition = (history: number[], condition: { type: string; value: number; occurrences: number }) => {
  const recent = history.slice(-condition.occurrences);
  if (recent.length < condition.occurrences) return false;

  switch (condition.type) {
    case 'streak_below':
      return recent.every((value) => value < condition.value);
    case 'streak_above':
      return recent.every((value) => value > condition.value);
    case 'multiplier_below':
      return recent.every((value) => value < condition.value);
    case 'multiplier_above':
      return recent.every((value) => value > condition.value);
    default:
      return false;
  }
};

export class StrategyEngine {
  constructor(private readonly alertService: AlertService) {}

  async evaluateAll(gameUrl: string, roundHistory: number[], summary: RoundSummary) {
    const strategies = await StrategyModel.find({ enabled: true }).lean();
    const now = Date.now();

    for (const strategy of strategies) {
      const cooldown = strategy.cooldownSeconds * 1000;
      if (strategy.lastTriggeredAt && now - new Date(strategy.lastTriggeredAt).getTime() < cooldown) {
        continue;
      }

      const matched = strategy.conditions.every((condition) => evaluateCondition(roundHistory, condition));
      if (!matched) continue;

      const message = `[${strategy.name}] ${summary.gameUrl}\nRound ${summary.roundId} crashed at ${summary.multiplier.toFixed(2)}x\nBelow-10 streak: ${summary.streakBelow10}`;
      await this.alertService.send({
        userId: strategy.userId.toString(),
        strategyId: (strategy as { _id: { toString: () => string } })._id.toString(),
        gameUrl,
        roundId: summary.roundId,
        multiplier: summary.multiplier,
        streak: summary.streakBelow10,
        channel: strategy.alert.channel,
        message
      });

      await StrategyModel.findByIdAndUpdate((strategy as { _id: string })._id, { $set: { lastTriggeredAt: new Date() } });
    }
  }
}
