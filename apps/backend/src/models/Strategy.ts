import mongoose, { Schema, Types } from 'mongoose';

export type ConditionType = 'streak_below' | 'streak_above' | 'multiplier_below' | 'multiplier_above';

export interface StrategyCondition {
  type: ConditionType;
  value: number;
  occurrences: number;
}

export interface StrategyDoc {
  userId: Types.ObjectId;
  name: string;
  enabled: boolean;
  cooldownSeconds: number;
  conditions: StrategyCondition[];
  alert: {
    channel: 'telegram' | 'discord' | 'webhook' | 'email';
  };
  lastTriggeredAt?: Date;
}

const strategyConditionSchema = new Schema<StrategyCondition>(
  {
    type: { type: String, enum: ['streak_below', 'streak_above', 'multiplier_below', 'multiplier_above'], required: true },
    value: { type: Number, required: true },
    occurrences: { type: Number, required: true, min: 1, max: 30 }
  },
  { _id: false }
);

const strategySchema = new Schema<StrategyDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    cooldownSeconds: { type: Number, default: 60, min: 0 },
    conditions: { type: [strategyConditionSchema], default: [] },
    alert: {
      channel: { type: String, enum: ['telegram', 'discord', 'webhook', 'email'], required: true }
    },
    lastTriggeredAt: Date
  },
  { timestamps: true }
);

export const StrategyModel = mongoose.model<StrategyDoc>('Strategy', strategySchema);
