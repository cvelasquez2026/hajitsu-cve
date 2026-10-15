export interface ParticipantView {
  /** Id público (no es el sessionId, para evitar suplantación). */
  id: string;
  voter: boolean;
  hasVoted: boolean;
  /** Sólo presente tras revelar, o para el propio usuario. */
  vote?: string;
  isMe: boolean;
}

export interface RoomState {
  roomId: string;
  revealed: boolean;
  forcedReveal: boolean;
  sorted: boolean;
  voterCount: number;
  votedCount: number;
  connectedCount: number;
  participants: ParticipantView[];
}

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface CreateRoomResult {
  roomId: string;
  adminToken: string;
}

export const EVENTS = {
  createRoom: 'create room',
  roomInfo: 'room info',
  joinRoom: 'join room',
  vote: 'vote',
  unvote: 'unvote',
  toggleVoter: 'toggle voter',
  resetVote: 'reset vote',
  forceReveal: 'force reveal',
  sortVotes: 'sort votes',
  roomState: 'room state',
} as const;
