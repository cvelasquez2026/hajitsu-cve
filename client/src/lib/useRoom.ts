import { useCallback, useEffect, useState } from 'react';
import { EVENTS, type RoomState } from '../../../shared/src';
import { getSessionId } from './session';
import { request, socket } from './socket';

/** Se une a la sala, mantiene su estado sincronizado y se re-une tras cada reconexión. */
export function useRoom(roomId: string, onFatal: (error: string) => void) {
  const [state, setState] = useState<RoomState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const join = async () => {
      const res = await request(EVENTS.joinRoom, { roomId, sessionId: getSessionId() });
      if (active && !res.ok) onFatal(res.error);
    };
    const onState = (s: RoomState) => {
      if (s.roomId === roomId) setState(s);
    };

    socket.on(EVENTS.roomState, onState);
    socket.on('connect', join);
    if (socket.connected) join();

    return () => {
      active = false;
      socket.off(EVENTS.roomState, onState);
      socket.off('connect', join);
    };
    // onFatal es estable por diseño del llamador; sólo nos re-unimos si cambia la sala.
  }, [roomId]);

  const act = useCallback(async (event: string, payload: object = {}) => {
    const res = await request(event, payload);
    setActionError(res.ok ? null : res.error);
  }, []);

  return { state, actionError, act };
}
