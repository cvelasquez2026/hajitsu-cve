interface CardProps {
  value?: string;
  /** Carta boca abajo (voto oculto). */
  faceDown?: boolean;
  /** Hueco vacío (aún no votó). */
  empty?: boolean;
  tone?: string;
}

export function Card({ value, faceDown, empty, tone }: CardProps) {
  if (empty) return <div className="card card-empty" aria-label="Sin votar" />;
  if (faceDown) return <div className="card card-back" aria-label="Voto oculto" />;
  return (
    <div className={`card card-face ${tone ?? ''}`} aria-label={`Voto ${value}`}>
      {value}
    </div>
  );
}
