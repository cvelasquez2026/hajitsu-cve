import { BLACK_CAT } from '../../../shared/src';

/** Texto accesible de una carta. */
export function cardLabel(value: string): string {
  return value === BLACK_CAT ? 'gato negro' : value;
}

/**
 * Contenido visual de una carta. El gato negro se dibuja en SVG porque el emoji 🐈‍⬛ es una
 * secuencia ZWJ (Emoji 13) que muchas fuentes no soportan y se ve como 🐈 + ⬛.
 */
export function CardValue({ value }: { value: string }) {
  if (value !== BLACK_CAT) return <>{value}</>;
  return (
    <svg className="cat-icon" viewBox="0 0 24 24" role="img" aria-label="Gato negro">
      <path d="M17.5 21.5c3.5 0 4.2-3.2 3-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="12" cy="16.5" rx="6" ry="6" fill="currentColor" />
      <path d="M7.9 7.4 8.3 1.8l3.1 3.3h1.2l3.1-3.3.4 5.6z" fill="currentColor" />
      <circle cx="12" cy="8.3" r="4.3" fill="currentColor" />
      <circle cx="10.3" cy="8" r="0.9" fill="#f5c542" />
      <circle cx="13.7" cy="8" r="0.9" fill="#f5c542" />
    </svg>
  );
}
