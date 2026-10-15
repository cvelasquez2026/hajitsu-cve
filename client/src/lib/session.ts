// sessionStorage: sobrevive a F5 pero cada pestaña es un participante distinto.
const SESSION_KEY = 'pp-session-id';
const adminKey = (roomId: string) => `pp-admin-${roomId}`;

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: se pierde la persistencia, la app sigue funcionando */
  }
}

let memorySessionId: string | null = null;

export function getSessionId(): string {
  const stored = safeGet(sessionStorage, SESSION_KEY);
  if (stored) return stored;
  memorySessionId ??= randomId();
  safeSet(sessionStorage, SESSION_KEY, memorySessionId);
  return memorySessionId;
}

export const getAdminToken = (roomId: string) => safeGet(localStorage, adminKey(roomId));
export const saveAdminToken = (roomId: string, token: string) => safeSet(localStorage, adminKey(roomId), token);
