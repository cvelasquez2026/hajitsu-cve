import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { type Ack, EVENTS } from '../../shared/src';
import type { Lobby } from './lobby';
import type { Room } from './room';

type AckFn = (res: Ack<Record<string, unknown>>) => void;

const roomIdSchema = z.object({ roomId: z.string().regex(/^\d{1,12}$/) });
const joinSchema = roomIdSchema.extend({ sessionId: z.string().min(8).max(128) });
const voteSchema = z.object({ card: z.string().max(8) });
const voterSchema = z.object({ voter: z.boolean() });
const adminSchema = z.object({ adminToken: z.string().max(128) });

interface SocketData {
  roomId?: string;
  sessionId?: string;
}

export function registerHandlers(io: Server, lobby: Lobby) {
  const broadcast = (room: Room) => {
    for (const [sessionId, socketId] of room.connectedSockets()) {
      io.to(socketId).emit(EVENTS.roomState, room.stateFor(sessionId));
    }
  };

  io.on('connection', (socket: Socket) => {
    const data = socket.data as SocketData;

    /** Envuelve un handler: valida payload, garantiza un ack y captura errores. */
    const on = <S extends z.ZodTypeAny>(
      event: string,
      schema: S,
      handler: (payload: z.infer<S>) => Ack<Record<string, unknown>>,
    ) => {
      socket.on(event, (raw: unknown, maybeAck?: AckFn) => {
        const ack: AckFn = typeof maybeAck === 'function' ? maybeAck : () => {};
        const parsed = schema.safeParse(raw ?? {});
        if (!parsed.success) return ack({ ok: false, error: 'Datos inválidos' });
        try {
          ack(handler(parsed.data));
        } catch (err) {
          console.error(`[${event}]`, err);
          ack({ ok: false, error: 'Error interno' });
        }
      });
    };

    const currentRoom = (): Room | undefined => (data.roomId ? lobby.getRoom(data.roomId) : undefined);

    /** Acción de un participante ya unido a la sala. */
    const participantAction = <S extends z.ZodTypeAny>(
      event: string,
      schema: S,
      action: (room: Room, sessionId: string, payload: z.infer<S>) => boolean,
    ) =>
      on(event, schema, (payload) => {
        const room = currentRoom();
        if (!room || !data.sessionId) return { ok: false, error: 'No estás en una sala' };
        if (!action(room, data.sessionId, payload)) return { ok: false, error: 'Acción no permitida' };
        broadcast(room);
        return { ok: true };
      });

    /** Acción reservada al admin de la sala (requiere adminToken). */
    const adminAction = <S extends typeof adminSchema>(
      event: string,
      schema: S,
      action: (room: Room, payload: z.infer<S>) => boolean,
    ) =>
      on(event, schema, (payload) => {
        const room = currentRoom();
        if (!room) return { ok: false, error: 'No estás en una sala' };
        if (!room.isAdmin(payload.adminToken)) return { ok: false, error: 'No autorizado' };
        if (!action(room, payload)) return { ok: false, error: 'Acción no permitida' };
        broadcast(room);
        return { ok: true };
      });

    on(EVENTS.createRoom, z.object({}).passthrough(), () => {
      const room = lobby.createRoom();
      return { ok: true, roomId: room.id, adminToken: room.adminToken };
    });

    on(EVENTS.roomInfo, roomIdSchema, ({ roomId }) =>
      lobby.getRoom(roomId) ? { ok: true, roomId } : { ok: false, error: 'La sala no existe' },
    );

    on(EVENTS.joinRoom, joinSchema, ({ roomId, sessionId }) => {
      const room = lobby.getRoom(roomId);
      if (!room) return { ok: false, error: 'La sala no existe' };
      const previous = currentRoom();
      if (previous && previous !== room) {
        previous.leave(socket.id);
        socket.leave(previous.id);
        broadcast(previous);
      }
      data.roomId = roomId;
      data.sessionId = sessionId;
      socket.join(roomId);
      room.join(sessionId, socket.id);
      broadcast(room);
      return { ok: true };
    });

    participantAction(EVENTS.vote, voteSchema, (room, sid, { card }) => room.vote(sid, card));
    participantAction(EVENTS.unvote, z.object({}).passthrough(), (room, sid) => room.unvote(sid));
    participantAction(EVENTS.toggleVoter, voterSchema, (room, sid, { voter }) => room.setVoter(sid, voter));

    adminAction(EVENTS.resetVote, adminSchema, (room) => (room.reset(), true));
    adminAction(EVENTS.forceReveal, adminSchema, (room) => room.forceReveal());
    adminAction(EVENTS.sortVotes, adminSchema, (room) => room.sort());

    socket.on('disconnect', () => {
      const room = currentRoom();
      if (room?.leave(socket.id)) broadcast(room);
    });
  });
}
