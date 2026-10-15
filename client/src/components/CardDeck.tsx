import { CardValue, cardLabel } from './CardValue';

interface CardDeckProps {
  cards: readonly string[];
  selected?: string;
  disabled: boolean;
  onPick: (card: string) => void;
}

export function CardDeck({ cards, selected, disabled, onPick }: CardDeckProps) {
  return (
    <div className="deck" role="group" aria-label="Tus cartas">
      {cards.map((card) => (
        <button
          key={card}
          className={`deck-card ${selected === card ? 'is-selected' : ''}`}
          aria-pressed={selected === card}
          aria-label={cardLabel(card)}
          disabled={disabled}
          onClick={() => onPick(card)}
        >
          <CardValue value={card} />
        </button>
      ))}
    </div>
  );
}
