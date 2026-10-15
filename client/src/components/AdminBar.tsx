import type { RoomState } from '../../../shared/src';

interface AdminBarProps {
  state: RoomState;
  onReset: () => void;
  onReveal: () => void;
  onSort: () => void;
}

export function AdminBar({ state, onReset, onReveal, onSort }: AdminBarProps) {
  return (
    <section className="admin" aria-label="Controles del moderador">
      <span className="admin-title">Moderador</span>
      <div className="admin-buttons">
        <button className="btn" onClick={onReveal} disabled={state.revealed || state.votedCount === 0}>
          Revelar
        </button>
        <button className="btn" onClick={onSort} disabled={!state.revealed || state.sorted}>
          Ordenar
        </button>
        <button className="btn btn-primary" onClick={onReset}>
          Nueva ronda
        </button>
      </div>
    </section>
  );
}
