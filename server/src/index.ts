import path from 'node:path';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 5000);
const roomTtlMs = Number(process.env.ROOM_TTL_HOURS ?? 24) * 60 * 60 * 1000;
const clientDist = process.env.CLIENT_DIST ?? path.resolve(__dirname, '../../client/dist');

const { httpServer } = createApp({ roomTtlMs, clientDist });

httpServer.listen(port, () => {
  console.log(`Planning Poker escuchando en http://localhost:${port}`);
});
