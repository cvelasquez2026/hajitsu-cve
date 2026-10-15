import { randomBytes, randomInt } from 'node:crypto';
import { Room } from './room';

export class Lobby {
  private rooms = new Map<string, Room>();

  constructor(private readonly ttlMs: number) {}

  createRoom(): Room {
    let id: string;
    do {
      id = String(randomInt(100000, 1000000));
    } while (this.rooms.has(id));
    const room = new Room(id, randomBytes(24).toString('hex'));
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  get size(): number {
    return this.rooms.size;
  }

  /** Elimina salas sin clientes conectados e inactivas más allá del TTL. Devuelve cuántas borró. */
  sweep(now = Date.now()): number {
    let removed = 0;
    for (const [id, room] of this.rooms) {
      if (!room.hasConnectedClients() && now - room.lastActivity > this.ttlMs) {
        this.rooms.delete(id);
        removed++;
      }
    }
    return removed;
  }
}
