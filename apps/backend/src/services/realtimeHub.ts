import { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RoundEvent } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class RealtimeHub {
  private readonly wss: WebSocketServer;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (socket, req) => {
      const url = new URL(req.url ?? '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        socket.close(1008, 'Missing token');
        return;
      }

      try {
        jwt.verify(token, env.jwtSecret);
        socket.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
      } catch {
        socket.close(1008, 'Invalid token');
      }
    });
  }

  broadcastRound(event: RoundEvent) {
    const payload = JSON.stringify({ type: 'round_event', event });
    for (const client of this.wss.clients) {
      if (client.readyState === 1) client.send(payload);
    }
    logger.debug({ event }, 'Broadcasted round event');
  }
}
