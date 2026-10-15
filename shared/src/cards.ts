/** Gato negro (secuencia ZWJ 🐈 + ⬛): carta no numérica, p. ej. "no sé / necesito más info". */
export const BLACK_CAT = '🐈‍⬛';

/** Único mazo de la aplicación. */
export const CARDS = ['1', '2', '3', '5', '8', '13', BLACK_CAT] as const;

export type Card = (typeof CARDS)[number];

export function isValidCard(card: string): card is Card {
  return (CARDS as readonly string[]).includes(card);
}

/** Valor numérico de una carta, o null si no es numérica (gato negro). */
export function cardNumericValue(card: string): number | null {
  return /^\d+$/.test(card) ? Number(card) : null;
}
