import { describe, expect, it } from 'vitest';
import { Room } from '../src/room';
import { Lobby } from '../src/lobby';
import { BLACK_CAT } from '../../shared/src';

function roomWith(...sessions: string[]) {
  const room = new Room('123456', 'token');
  sessions.forEach((s, i) => room.join(s, `socket-${i}`));
  return room;
}

describe('Room', () => {
  it('oculta los votos ajenos hasta que el admin revela, aunque todos hayan votado', () => {
    const room = roomWith('a', 'b');
    room.vote('a', '5');

    const forB = room.stateFor('b');
    expect(forB.revealed).toBe(false);
    const a = forB.participants.find((p) => !p.isMe)!;
    expect(a.hasVoted).toBe(true);
    expect(a.vote).toBeUndefined();

    const forA = room.stateFor('a');
    expect(forA.participants.find((p) => p.isMe)!.vote).toBe('5');

    room.vote('b', '8');
    const allVoted = room.stateFor('b');
    expect(allVoted.votedCount).toBe(2);
    expect(allVoted.revealed).toBe(false);
    expect(allVoted.participants.find((p) => !p.isMe)!.vote).toBeUndefined();

    expect(room.forceReveal()).toBe(true);
    const revealed = room.stateFor('b');
    expect(revealed.revealed).toBe(true);
    expect(revealed.participants.map((p) => p.vote).sort()).toEqual(['5', '8']);
  });

  it('rechaza cartas que no son del mazo y votos de observadores', () => {
    const room = roomWith('a');
    expect(room.vote('a', '21')).toBe(false);
    room.setVoter('a', false);
    expect(room.vote('a', '5')).toBe(false);
  });

  it('pasar a observador borra el voto y no cuenta como votante', () => {
    const room = roomWith('a', 'b');
    room.vote('a', '3');
    room.vote('b', '5');
    room.setVoter('b', false);
    const state = room.stateFor('a');
    expect(state.voterCount).toBe(1);
    expect(state.votedCount).toBe(1);
    expect(state.revealed).toBe(false);
    expect(state.participants.find((p) => !p.isMe)!.hasVoted).toBe(false);
  });

  it('unvote quita el voto', () => {
    const room = roomWith('a', 'b');
    room.vote('a', '3');
    room.unvote('a');
    expect(room.stateFor('a').votedCount).toBe(0);
  });

  it('no se puede revelar sin votos', () => {
    const room = roomWith('a', 'b');
    expect(room.forceReveal()).toBe(false);
  });

  it('revelar y reset', () => {
    const room = roomWith('a', 'b');
    room.vote('a', '3');
    expect(room.forceReveal()).toBe(true);
    expect(room.stateFor('b').revealed).toBe(true);
    expect(room.forceReveal()).toBe(false);
    room.reset();
    const state = room.stateFor('b');
    expect(state.revealed).toBe(false);
    expect(state.votedCount).toBe(0);
  });

  it('ordenar sólo tras revelar', () => {
    const room = roomWith('a', 'b', 'c');
    room.vote('a', '13');
    expect(room.sort()).toBe(false);
    room.vote('b', BLACK_CAT);
    room.vote('c', '2');
    expect(room.sort()).toBe(false);
    room.forceReveal();
    expect(room.sort()).toBe(true);
    expect(room.stateFor('a').participants.map((p) => p.vote)).toEqual(['2', '13', BLACK_CAT]);
  });

  it('acepta el gato negro como voto', () => {
    const room = roomWith('a');
    expect(room.vote('a', BLACK_CAT)).toBe(true);
    expect(room.stateFor('a').participants[0].vote).toBe(BLACK_CAT);
  });

  it('al reconectar conserva el voto y sólo lista conectados', () => {
    const room = roomWith('a', 'b');
    room.vote('a', '5');
    expect(room.leave('socket-0')).toBe('a');
    expect(room.stateFor('b').connectedCount).toBe(1);
    room.join('a', 'socket-9');
    expect(room.stateFor('a').participants.find((p) => p.isMe)!.vote).toBe('5');
  });

  it('valida el token de admin', () => {
    const room = new Room('1', 'secret');
    expect(room.isAdmin('secret')).toBe(true);
    expect(room.isAdmin('otro')).toBe(false);
    expect(room.isAdmin(undefined)).toBe(false);
  });
});

describe('Lobby', () => {
  it('crea salas con código numérico único', () => {
    const lobby = new Lobby(1000);
    const room = lobby.createRoom();
    expect(room.id).toMatch(/^\d{6}$/);
    expect(lobby.getRoom(room.id)).toBe(room);
    expect(lobby.getRoom('000')).toBeUndefined();
  });

  it('elimina salas inactivas sin conexiones', () => {
    const lobby = new Lobby(1000);
    const idle = lobby.createRoom();
    const busy = lobby.createRoom();
    busy.join('a', 's1');
    const later = Date.now() + 5000;
    expect(lobby.sweep(later)).toBe(1);
    expect(lobby.getRoom(idle.id)).toBeUndefined();
    expect(lobby.getRoom(busy.id)).toBe(busy);
  });
});
