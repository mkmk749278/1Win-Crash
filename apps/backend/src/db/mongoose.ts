import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const connectDatabase = async () => {
  await mongoose.connect(env.mongodbUri);
  logger.info('Connected to MongoDB');
};
