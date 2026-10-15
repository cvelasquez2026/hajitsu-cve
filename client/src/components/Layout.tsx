import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useConnectionStatus } from '../lib/useConnectionStatus';

export function Layout({ children }: { children: ReactNode }) {
  const connected = useConnectionStatus();
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand" title="Volver al lobby">
          <span className="brand-mark" aria-hidden="true">
            ♠
          </span>
          Planning Poker
        </Link>
        <span className={`status ${connected ? 'status-on' : 'status-off'}`} role="status">
          {connected ? 'Conectado' : 'Reconectando…'}
        </span>
      </header>
      <main className="content">{children}</main>
      <footer className="footer">
        Sin registro. Las salas desaparecen cuando dejan de usarse. Inspirado en{' '}
        <a href="https://github.com/richarcher/Hatjitsu">Hatjitsu</a>.
      </footer>
    </div>
  );
}
