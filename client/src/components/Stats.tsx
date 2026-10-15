import type { Consensus, VoteStats } from '../../../shared/src';

const LABELS: Record<Consensus, { text: string; className: string }> = {
  unanimous: { text: '¡Consenso total!', className: 'badge-good' },
  'not-unanimous': { text: 'Sin unanimidad', className: 'badge-warn' },
  problem: { text: 'Votos dispersos: comentadlo y repetid', className: 'badge-bad' },
};

export function Stats({ stats, consensus }: { stats: VoteStats | null; consensus: Consensus | null }) {
  return (
    <div className="stats" aria-live="polite">
      {consensus && <span className={`badge ${LABELS[consensus].className}`}>{LABELS[consensus].text}</span>}
      {stats && (
        <dl className="stat-list">
          <div>
            <dt>Promedio</dt>
            <dd>{stats.average}</dd>
          </div>
          <div>
            <dt>Desviación</dt>
            <dd>{stats.stdDev}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
