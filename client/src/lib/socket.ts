import { io } from 'socket.io-client';
import type { Ack } from '../../../shared/src';

export const socket = io({ transports: ['websocket', 'polling'] });

/** Emite un evento y resuelve con el ack del servidor (o un error si no responde). */
export async function request<T extends object = object>(event: string, payload: object = {}): Promise<Ack<T>> {
  try {
    return await socket.timeout(5000).emitWithAck(event, payload);
  } catch {
    return { ok: false, error: 'El servidor no responde. Inténtalo de nuevo.' };
  }
}
