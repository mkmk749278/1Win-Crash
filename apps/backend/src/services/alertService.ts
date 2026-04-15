import nodemailer from 'nodemailer';
import { AlertLogModel } from '../models/AlertLog.js';
import { UserModel } from '../models/User.js';
import { logger } from '../utils/logger.js';

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

interface AlertPayload {
  userId: string;
  strategyId: string;
  gameUrl: string;
  roundId: string;
  multiplier: number;
  streak: number;
  channel: 'telegram' | 'discord' | 'webhook' | 'email';
  message: string;
}

export class AlertService {
  async send(payload: AlertPayload) {
    const user = await UserModel.findById(payload.userId).lean();
    let delivered = false;
    let error: string | undefined;

    try {
      if (!user) throw new Error('User not found');
      switch (payload.channel) {
        case 'telegram':
          if (!process.env.TELEGRAM_BOT_TOKEN || !user.telegramChatId) throw new Error('Telegram not configured');
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: user.telegramChatId, text: payload.message })
          });
          delivered = true;
          break;
        case 'discord':
          if (!user.discordWebhook) throw new Error('Discord webhook not configured');
          await fetch(user.discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: payload.message })
          });
          delivered = true;
          break;
        case 'webhook':
          if (!user.customWebhook) throw new Error('Custom webhook not configured');
          await fetch(user.customWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          delivered = true;
          break;
        case 'email':
          if (!user.emailTarget) throw new Error('Email target not configured');
          await mailer.sendMail({
            from: process.env.SMTP_FROM ?? 'alerts@1win-observer.local',
            to: user.emailTarget,
            subject: '1win crash strategy alert',
            text: payload.message
          });
          delivered = true;
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown alert error';
      logger.error({ err }, 'Failed to send alert');
    }

    await AlertLogModel.create({
      userId: payload.userId,
      strategyId: payload.strategyId,
      gameUrl: payload.gameUrl,
      roundId: payload.roundId,
      multiplier: payload.multiplier,
      streak: payload.streak,
      channel: payload.channel,
      delivered,
      error,
      payload
    });

    return { delivered, error };
  }
}
