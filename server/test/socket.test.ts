import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioc, type Socket } from 'socket.io-client';
import { createApp } from '../src/app';
import { EVENTS, type RoomState } from '../../shared/src';

let url: string;
const { httpServer, io } = createApp({ roomTtlMs: 60_000 });
const clients: Socket[] = [];

beforeAll(async () => {
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(() => {
  clients.forEach((c) => c.disconnect());
  io.close();
});

function connect(): Promise<Socket> {
  const socket = ioc(url, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  return new Promise((resolve) => socket.on('connect', () => resolve(socket)));
}

const emit = (socket: Socket, event: string, payload: object = {}): Promise<any> =>
  socket.timeout(2000).emitWithAck(event, payload);

/** Espera el próximo `room state` que cumpla el predicado. */
function nextState(socket: Socket, predicate: (s: RoomState) => boolean = () => true): Promise<RoomState> {
  return new Promise((resolve) => {
    const handler = (s: RoomState) => {
      if (predicate(s)) {
        socket.off(EVENTS.roomState, handler);
        resolve(s);
      }
    };
    socket.on(EVENTS.roomState, handler);
  });
}

describe('Socket.IO', () => {
  it('flujo completo: crear, unirse, votar oculto, revelar por admin, reset', async () => {
    const admin = await connect();
    const created = await emit(admin, EVENTS.createRoom);
    expect(created.ok).toBe(true);
    const { roomId, adminToken } = created;

    expect(await emit(admin, EVENTS.roomInfo, { roomId })).toEqual({ ok: true, roomId });
    expect((await emit(admin, EVENTS.roomInfo, { roomId: '1' })).ok).toBe(false);

    const peer = await connect();
    await emit(admin, EVENTS.joinRoom, { roomId, sessionId: 'session-admin' });
    const peerJoined = nextState(admin, (s) => s.connectedCount === 2);
    await emit(peer, EVENTS.joinRoom, { roomId, sessionId: 'session-peer' });
    await peerJoined;

    const peerSeesHidden = nextState(peer, (s) => s.votedCount === 1);
    await emit(admin, EVENTS.vote, { card: '5' });
    const hidden = await peerSeesHidden;
    expect(hidden.revealed).toBe(false);
    expect(hidden.participants.find((p) => !p.isMe)).toMatchObject({ hasVoted: true });
    expect(hidden.participants.find((p) => !p.isMe)!.vote).toBeUndefined();
    expect(JSON.stringify(hidden)).not.toContain('"5"');

    const allVotedState = nextState(admin, (s) => s.votedCount === 2);
    await emit(peer, EVENTS.vote, { card: '8' });
    const allVoted = await allVotedState;
    expect(allVoted.revealed).toBe(false);
    expect(JSON.stringify(allVoted)).not.toContain('"8"');

    const revealedState = nextState(peer, (s) => s.revealed);
    expect(await emit(admin, EVENTS.forceReveal, { adminToken })).toEqual({ ok: true });
    const revealed = await revealedState;
    expect(revealed.participants.map((p) => p.vote).sort()).toEqual(['5', '8']);

    const resetState = nextState(peer, (s) => !s.revealed);
    expect(await emit(admin, EVENTS.resetVote, { adminToken })).toEqual({ ok: true });
    expect((await resetState).votedCount).toBe(0);
  });

  it('rechaza acciones de admin sin token válido', async () => {
    const admin = await connect();
    const { roomId } = await emit(admin, EVENTS.createRoom);
    const other = await connect();
    await emit(other, EVENTS.joinRoom, { roomId, sessionId: 'session-other' });
    expect(await emit(other, EVENTS.resetVote, { adminToken: 'falso' })).toEqual({ ok: false, error: 'No autorizado' });
  });

  it('rechaza unirse a sala inexistente y payloads inválidos', async () => {
    const s = await connect();
    expect((await emit(s, EVENTS.joinRoom, { roomId: '999', sessionId: 'session-x' })).ok).toBe(false);
    expect(await emit(s, EVENTS.joinRoom, { roomId: 'abc' })).toEqual({ ok: false, error: 'Datos inválidos' });
    expect((await emit(s, EVENTS.vote, { card: '5' })).ok).toBe(false);
  });

  it('al desconectarse desaparece de la lista y al reconectar recupera su voto', async () => {
    const admin = await connect();
    const { roomId } = await emit(admin, EVENTS.createRoom);
    await emit(admin, EVENTS.joinRoom, { roomId, sessionId: 'session-a1' });
    const peer = await connect();
    await emit(peer, EVENTS.joinRoom, { roomId, sessionId: 'session-p1' });
    await emit(peer, EVENTS.vote, { card: '3' });

    const afterLeave = nextState(admin, (s) => s.connectedCount === 1);
    peer.disconnect();
    await afterLeave;

    const again = await connect();
    const mine = nextState(again);
    await emit(again, EVENTS.joinRoom, { roomId, sessionId: 'session-p1' });
    expect((await mine).participants.find((p) => p.isMe)!.vote).toBe('3');
  });
});
