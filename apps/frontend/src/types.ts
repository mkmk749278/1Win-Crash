export interface StrategyCondition {
  type: 'streak_below' | 'streak_above' | 'multiplier_below' | 'multiplier_above';
  value: number;
  occurrences: number;
}

export interface Strategy {
  _id: string;
  name: string;
  enabled: boolean;
  cooldownSeconds: number;
  conditions: StrategyCondition[];
  alert: { channel: 'telegram' | 'discord' | 'webhook' | 'email' };
}

export interface RoundRow {
  _id: string;
  gameUrl: string;
  roundId: string;
  multiplier: number;
  endedAt: string;
}

export interface Analytics {
  rounds: number;
  averageMultiplier: number;
  volatility: number;
  lowCrashes: number;
  highCrashes: number;
}

export interface AlertRow {
  _id: string;
  roundId: string;
  multiplier: number;
  streak: number;
  channel: string;
  delivered: boolean;
  createdAt: string;
  error?: string;
}
