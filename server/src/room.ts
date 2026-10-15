import { randomUUID, timingSafeEqual } from 'node:crypto';
import { type RoomState, compareCards, isValidCard } from '../../shared/src';

interface Connection {
  publicId: string;
  socketId: string | null;
  vote: string | null;
  voter: boolean;
}

export class Room {
  lastActivity = Date.now();
  private forcedReveal = false;
  private sorted = false;
  /** sessionId → conexión. Se conservan las sesiones desconectadas para permitir reconexión. */
  private connections = new Map<string, Connection>();

  constructor(
    readonly id: string,
    readonly adminToken: string,
  ) {}

  isAdmin(token: string | undefined): boolean {
    if (!token) return false;
    const a = Buffer.from(token);
    const b = Buffer.from(this.adminToken);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  join(sessionId: string, socketId: string): void {
    const existing = this.connections.get(sessionId);
    if (existing) existing.socketId = socketId;
    else this.connections.set(sessionId, { publicId: randomUUID(), socketId, vote: null, voter: true });
    this.touch();
  }

  /** Devuelve el sessionId asociado al socket, si existía. */
  leave(socketId: string): string | undefined {
    for (const [sessionId, conn] of this.connections) {
      if (conn.socketId === socketId) {
        conn.socketId = null;
        this.touch();
        return sessionId;
      }
    }
    return undefined;
  }

  vote(sessionId: string, card: string): boolean {
    const conn = this.connections.get(sessionId);
    if (!conn?.voter || !isValidCard(card)) return false;
    conn.vote = card;
    this.sorted = false;
    this.touch();
    return true;
  }

  unvote(sessionId: string): boolean {
    const conn = this.connections.get(sessionId);
    if (!conn) return false;
    conn.vote = null;
    this.touch();
    return true;
  }

  setVoter(sessionId: string, voter: boolean): boolean {
    const conn = this.connections.get(sessionId);
    if (!conn) return false;
    conn.voter = voter;
    if (!voter) conn.vote = null;
    this.touch();
    return true;
  }

  reset(): void {
    for (const conn of this.connections.values()) conn.vote = null;
    this.forcedReveal = false;
    this.sorted = false;
    this.touch();
  }

  forceReveal(): boolean {
    if (this.counts().votedCount === 0 || this.revealed) return false;
    this.forcedReveal = true;
    this.touch();
    return true;
  }

  sort(): boolean {
    if (!this.revealed || this.sorted) return false;
    this.sorted = true;
    this.touch();
    return true;
  }

  /** Los votos sólo se revelan cuando el moderador lo decide. */
  get revealed(): boolean {
    return this.forcedReveal;
  }

  hasConnectedClients(): boolean {
    return this.connectedEntries().length > 0;
  }

  /** Pares [sessionId, socketId] de los clientes conectados. */
  connectedSockets(): Array<[string, string]> {
    return this.connectedEntries().map(([sid, c]) => [sid, c.socketId!]);
  }

  /** Estado visto por un participante concreto: los votos ajenos se ocultan hasta revelar. */
  stateFor(sessionId: string): RoomState {
    const revealed = this.revealed;
    let entries = this.connectedEntries();
    if (this.sorted) {
      entries = [...entries].sort(([, a], [, b]) => {
        if (a.vote === null) return 1;
        if (b.vote === null) return -1;
        return compareCards(a.vote, b.vote);
      });
    }
    const participants = entries.map(([sid, c]) => {
      const isMe = sid === sessionId;
      return {
        id: c.publicId,
        voter: c.voter,
        hasVoted: c.vote !== null,
        isMe,
        ...(c.vote !== null && (revealed || isMe) ? { vote: c.vote } : {}),
      };
    });
    return {
      roomId: this.id,
      revealed,
      forcedReveal: this.forcedReveal,
      sorted: this.sorted,
      ...this.counts(),
      connectedCount: entries.length,
      participants,
    };
  }

  private connectedEntries(): Array<[string, Connection]> {
    return [...this.connections].filter(([, c]) => c.socketId !== null);
  }

  private counts() {
    const voters = this.connectedEntries().filter(([, c]) => c.voter);
    return { voterCount: voters.length, votedCount: voters.filter(([, c]) => c.vote !== null).length };
  }

  private touch() {
    this.lastActivity = Date.now();
  }
}
