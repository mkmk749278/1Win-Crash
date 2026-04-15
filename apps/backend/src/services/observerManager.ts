import { chromium } from 'playwright';
import WebSocket from 'ws';
import { env } from '../config/env.js';
import { GameRoundModel } from '../models/GameRound.js';
import { RoundEvent } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { StrategyEngine } from './strategyEngine.js';
import { RealtimeHub } from './realtimeHub.js';

type RoundState = { id: string; startedAt: Date; latestMultiplier: number };

export class ObserverManager {
  private readonly history = new Map<string, number[]>();
  private readonly roundState = new Map<string, RoundState>();

  constructor(private readonly hub: RealtimeHub, private readonly strategyEngine: StrategyEngine) {}

  start() {
    for (const gameUrl of env.gameUrls) {
      this.connectGame(gameUrl);
    }
  }

  private async resolveGameWsUrl(pageUrl: string) {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      let discovered = '';
      page.on('websocket', (ws) => {
        discovered = ws.url();
      });
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000);
      if (!discovered) {
        discovered = await page.evaluate(() => {
          const entries = performance.getEntriesByType('resource').map((entry) => entry.name);
          return entries.find((entry) => entry.startsWith('wss://')) ?? '';
        });
      }
      if (!discovered) {
        throw new Error('Could not discover live WebSocket URL');
      }
      return discovered;
    } finally {
      await browser.close();
    }
  }

  private async connectGame(gameUrl: string) {
    try {
      const wsUrl = await this.resolveGameWsUrl(gameUrl);
      logger.info({ gameUrl, wsUrl }, 'Connecting observer to live game websocket');
      const socket = new WebSocket(wsUrl);

      socket.on('message', async (raw) => {
        const event = this.parseIncoming(gameUrl, raw.toString());
        if (!event) return;
        this.hub.broadcastRound(event);
        await this.handleEvent(event);
      });

      socket.on('close', () => {
        logger.warn({ gameUrl }, 'Game websocket closed, reconnecting');
        setTimeout(() => this.connectGame(gameUrl), env.observerReconnectMs);
      });

      socket.on('error', (error) => logger.error({ gameUrl, error }, 'Game websocket error'));
    } catch (error) {
      logger.error({ gameUrl, error }, 'Observer setup failed, retrying');
      setTimeout(() => this.connectGame(gameUrl), env.observerReconnectMs);
    }
  }

  private parseIncoming(gameUrl: string, rawMessage: string): RoundEvent | null {
    try {
      const message = JSON.parse(rawMessage);
      if (message.type === 'round_start') {
        return { type: 'round_start', gameUrl, roundId: String(message.roundId), timestamp: new Date().toISOString() };
      }
      if (message.type === 'multiplier_update') {
        return {
          type: 'multiplier_update',
          gameUrl,
          roundId: String(message.roundId),
          multiplier: Number(message.multiplier),
          timestamp: new Date().toISOString()
        };
      }
      if (message.type === 'round_end') {
        return {
          type: 'round_end',
          gameUrl,
          roundId: String(message.roundId),
          multiplier: Number(message.multiplier),
          timestamp: new Date().toISOString()
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async handleEvent(event: RoundEvent) {
    if (event.type === 'round_start') {
      this.roundState.set(event.gameUrl, { id: event.roundId, startedAt: new Date(event.timestamp), latestMultiplier: 1 });
      return;
    }

    if (event.type === 'multiplier_update' && typeof event.multiplier === 'number') {
      const state = this.roundState.get(event.gameUrl);
      if (state && state.id === event.roundId) state.latestMultiplier = event.multiplier;
      return;
    }

    if (event.type === 'round_end' && typeof event.multiplier === 'number') {
      const state = this.roundState.get(event.gameUrl);
      const list = this.history.get(event.gameUrl) ?? [];
      list.push(event.multiplier);
      if (list.length > env.roundHistoryLimit) list.splice(0, list.length - env.roundHistoryLimit);
      this.history.set(event.gameUrl, list);

      await GameRoundModel.updateOne(
        { gameUrl: event.gameUrl, roundId: event.roundId },
        {
          $set: {
            gameUrl: event.gameUrl,
            roundId: event.roundId,
            multiplier: event.multiplier,
            startedAt: state?.startedAt,
            endedAt: new Date(event.timestamp)
          }
        },
        { upsert: true }
      );

      const streakBelow10 = [...list].reverse().findIndex((value) => value >= 10);
      const below = streakBelow10 === -1 ? list.length : streakBelow10;
      const streakAbove10 = [...list].reverse().findIndex((value) => value <= 10);
      const above = streakAbove10 === -1 ? list.length : streakAbove10;

      await this.strategyEngine.evaluateAll(event.gameUrl, list, {
        gameUrl: event.gameUrl,
        roundId: event.roundId,
        multiplier: event.multiplier,
        streakBelow10: below,
        streakAbove10: above
      });
    }
  }
}
