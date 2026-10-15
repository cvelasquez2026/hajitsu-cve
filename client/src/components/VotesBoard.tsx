import type { Consensus, RoomState } from '../../../shared/src';
import { Card } from './Card';

const TONES: Record<Consensus, string> = {
  unanimous: 'tone-good',
  'not-unanimous': 'tone-warn',
  problem: 'tone-bad',
};

export function VotesBoard({ state, consensus }: { state: RoomState; consensus: Consensus | null }) {
  const voters = state.participants.filter((p) => p.voter);
  const tone = state.revealed && consensus ? TONES[consensus] : undefined;

  if (voters.length === 0) {
    return <p className="muted center">Todavía no hay votantes en la sala.</p>;
  }

  return (
    <ul className="board">
      {voters.map((p) => (
        <li key={p.id} className={`seat ${p.isMe ? 'seat-me' : ''}`}>
          {!p.hasVoted ? (
            <Card empty />
          ) : p.vote !== undefined && (state.revealed || p.isMe) ? (
            <Card value={p.vote} tone={state.revealed ? tone : 'tone-mine'} />
          ) : (
            <Card faceDown />
          )}
          <span className="seat-label">{p.isMe ? 'Tú' : p.hasVoted ? 'Votó' : 'Pensando…'}</span>
        </li>
      ))}
    </ul>
  );
}
