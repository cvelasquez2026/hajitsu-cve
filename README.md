# Planning Poker

Aplicación web de Planning Poker en tiempo real para estimar historias en el sprint planning.
Inspirada en [Hatjitsu](https://github.com/richarcher/Hatjitsu): sin login, con salas desechables.

## Funcionalidades
- **Lobby**: crear una sala (código numérico de 6 dígitos) o unirse por código.
- **Votación oculta**: los votos ajenos se muestran boca abajo hasta que el moderador pulsa **Revelar**, aunque ya hayan votado todos. El servidor **no envía** los valores antes de revelar.
- **Modo observador**: puede ver la sala, pero no vota.
- **Moderador** (quien crea la sala): revelar, ordenar votos y nueva ronda. El servidor valida un token secreto.
- **Cartas**: un único mazo con 1, 2, 3, 5, 8, 13 y un gato negro (no numérico: no cuenta para el promedio; se dibuja en SVG para que se vea igual en todos los navegadores).
- **Resultados**: promedio y desviación estándar de las cartas numéricas, e indicador de consenso (verde: unánime, amarillo: sin unanimidad, rojo: votos dispersos).
- **Reconexión**: al recargar (F5) se conserva el voto. Cada pestaña es un participante.
- **Limpieza**: las salas sin conexiones se eliminan tras `ROOM_TTL_HOURS` horas de inactividad.

## Stack
Node 20 · Express · Socket.IO 4 · React 18 + Vite · TypeScript · Vitest. La lógica de dominio compartida está en `shared/`.

```
shared/src   cartas, estadísticas, consenso, tipos de eventos
server/src   Express + Socket.IO (room.ts, lobby.ts, handlers.ts)
client/src   React (Lobby, Room y componentes)
```

## Desarrollo
```bash
npm install
npm run dev        # servidor :5000 + Vite :5173 (con proxy de WebSocket)
npm test           # tests de dominio e integración Socket.IO
npm run typecheck
```

## Producción
```bash
npm run build && npm start             # http://localhost:5000
# o con Docker
docker compose up -d --build           # http://localhost:5000
```

| Variable         | Por defecto | Descripción                                 |
| ---------------- | ----------- | ------------------------------------------- |
| `PORT`           | `5000`      | Puerto HTTP                                 |
| `ROOM_TTL_HOURS` | `24`        | Horas de inactividad antes de borrar una sala |

`GET /healthz` devuelve el número de salas y de sockets.

> El estado se guarda en memoria: al reiniciar el servidor se pierden las salas, y no admite varias instancias sin un adaptador (por ejemplo, Redis).
