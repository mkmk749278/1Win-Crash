import mongoose, { Schema } from 'mongoose';

export interface GameRoundDoc {
  gameUrl: string;
  roundId: string;
  multiplier: number;
  startedAt?: Date;
  endedAt: Date;
}

const gameRoundSchema = new Schema<GameRoundDoc>(
  {
    gameUrl: { type: String, required: true, index: true },
    roundId: { type: String, required: true },
    multiplier: { type: Number, required: true },
    startedAt: Date,
    endedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

gameRoundSchema.index({ gameUrl: 1, roundId: 1 }, { unique: true });

export const GameRoundModel = mongoose.model<GameRoundDoc>('GameRound', gameRoundSchema);
