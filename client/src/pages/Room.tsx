import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CARDS, EVENTS, computeConsensus, computeStats } from '../../../shared/src';
import { AdminBar } from '../components/AdminBar';
import { CardDeck } from '../components/CardDeck';
import { Stats } from '../components/Stats';
import { VotesBoard } from '../components/VotesBoard';
import { getAdminToken } from '../lib/session';
import { useRoom } from '../lib/useRoom';

export function Room() {
  const { roomId = '' } = useParams();
  if (!/^\d+$/.test(roomId)) return <Navigate to="/" replace />;
  return <RoomView key={roomId} roomId={roomId} />;
}

function waitingMessage(voterCount: number, votedCount: number, isAdmin: boolean): string {
  if (voterCount === 0) return 'Esperando votantes…';
  const pending = voterCount - votedCount;
  if (pending > 0) return `Esperando ${pending} voto${pending === 1 ? '' : 's'}…`;
  return isAdmin ? 'Todos han votado. Pulsa «Revelar» para mostrar los votos.' : 'Todos han votado. Esperando a que el moderador revele…';
}

function RoomView({ roomId }: { roomId: string }) {
  const navigate = useNavigate();
  const { state, actionError, act } = useRoom(roomId, (error) => navigate('/', { replace: true, state: { error } }));
  const adminToken = getAdminToken(roomId);
  const [copied, setCopied] = useState(false);

  const votes = useMemo(
    () => (state?.revealed ? state.participants.flatMap((p) => (p.voter && p.vote ? [p.vote] : [])) : []),
    [state],
  );
  const consensus = useMemo(() => computeConsensus(votes), [votes]);
  const stats = useMemo(() => computeStats(votes), [votes]);

  if (!state) return <p className="muted center">Entrando en la sala {roomId}…</p>;

  const me = state.participants.find((p) => p.isMe);
  const observers = state.participants.filter((p) => !p.voter).length;

  const pick = (card: string) =>
    me?.vote === card ? act(EVENTS.unvote) : act(EVENTS.vote, { card });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el portapapeles puede no estar disponible (http) */
    }
  };

  return (
    <div className="room">
      <section className="room-header">
        <div>
          <h1>
            Sala <span className="room-code">{roomId}</span>
          </h1>
          <p className="muted">
            Han votado {state.votedCount} de {state.voterCount}
            {observers > 0 && `, con ${observers} observador${observers === 1 ? '' : 'es'}`}.
          </p>
        </div>
        <button className="btn" onClick={copyLink}>
          {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
        </button>
      </section>

      {adminToken && (
        <AdminBar
          state={state}
          onReset={() => act(EVENTS.resetVote, { adminToken })}
          onReveal={() => act(EVENTS.forceReveal, { adminToken })}
          onSort={() => act(EVENTS.sortVotes, { adminToken })}
        />
      )}

      {actionError && (
        <p className="alert" role="alert">
          {actionError}
        </p>
      )}

      <section className={`table ${state.revealed ? 'is-revealed' : ''}`} aria-label="Votos">
        <div className="table-status">
          {state.revealed ? (
            <Stats stats={stats} consensus={consensus} />
          ) : (
            <span className="muted">{waitingMessage(state.voterCount, state.votedCount, Boolean(adminToken))}</span>
          )}
        </div>
        <VotesBoard state={state} consensus={consensus} />
      </section>

      <section className="hand">
        <div className="hand-header">
          <h2>Tu carta</h2>
          <label className="switch">
            <input
              type="checkbox"
              checked={!(me?.voter ?? true)}
              onChange={(e) => act(EVENTS.toggleVoter, { voter: !e.target.checked })}
            />
            <span>Sólo observar</span>
          </label>
        </div>
        <CardDeck cards={CARDS} selected={me?.vote} disabled={!me?.voter} onPick={pick} />
        {!me?.voter && <p className="muted center">Estás en modo observador: ves la sala pero no votas.</p>}
      </section>
    </div>
  );
}
