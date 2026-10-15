import { describe, expect, it } from 'vitest';
import { BLACK_CAT, CARDS, cardNumericValue, isValidCard } from './cards';
import { computeConsensus, computeStats, sortVotes } from './stats';

describe('cards', () => {
  it('define un único mazo: 1, 2, 3, 5, 8, 13 y gato negro', () => {
    expect(CARDS).toEqual(['1', '2', '3', '5', '8', '13', '🐈‍⬛']);
    expect(BLACK_CAT).toBe('🐈‍⬛');
  });

  it('el gato negro no tiene valor numérico', () => {
    expect(cardNumericValue('13')).toBe(13);
    expect(cardNumericValue(BLACK_CAT)).toBeNull();
  });

  it('sólo acepta cartas del mazo', () => {
    expect(isValidCard('5')).toBe(true);
    expect(isValidCard(BLACK_CAT)).toBe(true);
    expect(isValidCard('0')).toBe(false);
    expect(isValidCard('21')).toBe(false);
    expect(isValidCard('?')).toBe(false);
  });
});

describe('computeStats', () => {
  it('calcula promedio y desviación estándar sólo de cartas numéricas', () => {
    const stats = computeStats(['1', '3', BLACK_CAT]);
    expect(stats).toEqual({ average: 2, stdDev: 1, numericCount: 2 });
  });

  it('redondea a 2 decimales', () => {
    expect(computeStats(['1', '2', '2'])).toEqual({ average: 1.67, stdDev: 0.47, numericCount: 3 });
  });

  it('devuelve null sin cartas numéricas', () => {
    expect(computeStats([BLACK_CAT, BLACK_CAT])).toBeNull();
    expect(computeStats([])).toBeNull();
  });
});

describe('computeConsensus', () => {
  it('unánime cuando todos coinciden', () => {
    expect(computeConsensus(['5', '5', '5'])).toBe('unanimous');
    expect(computeConsensus(['8'])).toBe('unanimous');
  });

  it('problema cuando todos son distintos', () => {
    expect(computeConsensus(['1', '2'])).toBe('problem');
    expect(computeConsensus(['1', '2', '3'])).toBe('problem');
  });

  it('problema con más de 3 votantes y todos menos uno distintos', () => {
    expect(computeConsensus(['1', '1', '2', '3'])).toBe('problem');
  });

  it('no unánime en el resto de casos', () => {
    expect(computeConsensus(['1', '1', '2'])).toBe('not-unanimous');
    expect(computeConsensus(['1', '1', '2', '2'])).toBe('not-unanimous');
  });

  it('null sin votos', () => {
    expect(computeConsensus([])).toBeNull();
  });
});

describe('sortVotes', () => {
  it('ordena numéricas ascendente y el gato negro al final', () => {
    expect(sortVotes(['13', BLACK_CAT, '3', '1'])).toEqual(['1', '3', '13', BLACK_CAT]);
  });
});
