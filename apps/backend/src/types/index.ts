import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface RoundEvent {
  type: 'round_start' | 'multiplier_update' | 'round_end';
  gameUrl: string;
  roundId: string;
  multiplier?: number;
  timestamp: string;
}
