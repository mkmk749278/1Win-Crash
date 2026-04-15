import dotenv from 'dotenv';

dotenv.config();

const required = ['JWT_SECRET', 'MONGODB_URI'] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  gameUrls: (process.env.GAME_URLS ?? '').split(',').map((value) => value.trim()).filter(Boolean),
  roundHistoryLimit: Math.min(500, Math.max(100, Number(process.env.ROUND_HISTORY_LIMIT ?? 200))),
  observerReconnectMs: Number(process.env.OBSERVER_RECONNECT_MS ?? 5000)
};
