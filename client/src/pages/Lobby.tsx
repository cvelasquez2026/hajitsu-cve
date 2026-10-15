import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type CreateRoomResult, EVENTS } from '../../../shared/src';
import { saveAdminToken } from '../lib/session';
import { request } from '../lib/socket';

export function Lobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>((location.state as { error?: string } | null)?.error ?? null);

  const createRoom = async () => {
    setBusy(true);
    setError(null);
    const res = await request<CreateRoomResult>(EVENTS.createRoom);
    if (res.ok) {
      saveAdminToken(res.roomId, res.adminToken);
      navigate(`/${res.roomId}`);
    } else {
      setError(res.error);
      setBusy(false);
    }
  };

  const joinRoom = async (e: FormEvent) => {
    e.preventDefault();
    const roomId = roomCode.trim();
    if (!/^\d+$/.test(roomId)) {
      setError('El código de sala sólo contiene números.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await request(EVENTS.roomInfo, { roomId });
    if (res.ok) navigate(`/${roomId}`);
    else {
      setError(res.error);
      setBusy(false);
    }
  };

  return (
    <div className="lobby">
      <section className="hero">
        <h1>Estima historias en equipo, en tiempo real</h1>
        <p>
          Crea una sala, comparte el enlace y votad a la vez. Los votos permanecen ocultos hasta que el moderador
          los revela, para evitar sesgos.
        </p>
      </section>

      <div className="lobby-actions">
        <section className="panel">
          <h2>Nueva sala</h2>
          <p className="muted">Serás el moderador: podrás revelar los votos y empezar nuevas rondas.</p>
          <button className="btn btn-primary btn-lg" onClick={createRoom} disabled={busy}>
            Crear sala
          </button>
        </section>

        <section className="panel">
          <h2>Unirse a una sala</h2>
          <form onSubmit={joinRoom} className="join-form">
            <label htmlFor="room-code" className="sr-only">
              Código de sala
            </label>
            <input
              id="room-code"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Código (ej. 482913)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              disabled={busy}
            />
            <button className="btn" type="submit" disabled={busy || !roomCode.trim()}>
              Unirse
            </button>
          </form>
        </section>
      </div>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
