import mongoose, { Schema, Types } from 'mongoose';

const alertLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    strategyId: { type: Schema.Types.ObjectId, required: true, ref: 'Strategy' },
    gameUrl: { type: String, required: true },
    roundId: { type: String, required: true },
    multiplier: { type: Number, required: true },
    streak: { type: Number, required: true },
    channel: { type: String, required: true },
    delivered: { type: Boolean, required: true },
    error: String,
    payload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export interface AlertLogDoc {
  userId: Types.ObjectId;
}

export const AlertLogModel = mongoose.model('AlertLog', alertLogSchema);
