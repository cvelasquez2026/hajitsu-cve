import { cardNumericValue } from './cards';

export type Consensus = 'unanimous' | 'not-unanimous' | 'problem';

export interface VoteStats {
  average: number;
  stdDev: number;
  numericCount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Promedio y desviación estándar (poblacional) de las cartas numéricas. */
export function computeStats(votes: string[]): VoteStats | null {
  const values = votes.map(cardNumericValue).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - average) ** 2, 0) / values.length;
  return { average: round2(average), stdDev: round2(Math.sqrt(variance)), numericCount: values.length };
}

/** Misma regla que Hatjitsu: unánime, problema (votos dispersos) o no unánime. */
export function computeConsensus(votes: string[]): Consensus | null {
  if (votes.length === 0) return null;
  const unique = new Set(votes).size;
  if (unique === 1) return 'unanimous';
  if (unique === votes.length) return 'problem';
  if (votes.length > 3 && unique === votes.length - 1) return 'problem';
  return 'not-unanimous';
}

/** Orden ascendente por valor numérico; las cartas no numéricas van al final. */
export function compareCards(a: string, b: string): number {
  const va = cardNumericValue(a);
  const vb = cardNumericValue(b);
  if (va !== null && vb !== null) return va - vb;
  if (va !== null) return -1;
  if (vb !== null) return 1;
  return 0;
}

export function sortVotes(votes: string[]): string[] {
  return [...votes].sort(compareCards);
}
