import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import { registerHandlers } from './handlers';
import { Lobby } from './lobby';

export interface AppOptions {
  roomTtlMs: number;
  clientDist?: string;
}

export function createApp({ roomTtlMs, clientDist }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: false } });
  const lobby = new Lobby(roomTtlMs);

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', rooms: lobby.size, sockets: io.engine.clientsCount });
  });

  if (clientDist && existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    // Fallback SPA: el cliente decide si la sala existe y redirige al lobby si no.
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  registerHandlers(io, lobby);

  const sweeper = setInterval(() => lobby.sweep(), Math.min(roomTtlMs, 60_000));
  sweeper.unref();
  httpServer.on('close', () => clearInterval(sweeper));

  return { app, httpServer, io, lobby };
}
