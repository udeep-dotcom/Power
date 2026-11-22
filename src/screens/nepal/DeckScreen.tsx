// Flip-card decks (symbols, festivals, nature). Flip every card in a deck to earn its sticker.

import { useState } from 'preact/hooks';
import { Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { Celebration, TopBar } from '../../components/UI';
import { UI } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { DECKS } from '../../data/nepal';
import { goBack } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { instruct } from '../../lib/speech';
import { awardSticker, update, useStore } from '../../lib/store';
import { haptic, tr } from '../../lib/util';

export function DeckScreen({ deckId }: { deckId: string }) {
  const deck = DECKS.find((d) => d.id === deckId) ?? DECKS[0];
  const s = useStore();
  const [flipped, setFlipped] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const key = (id: string) => `${deck.id}:${id}`;
  const seenCount = deck.cards.filter((c) => s.cardsSeen.includes(key(c.id))).length;

  const flip = (id: string) => {
    sfx.flip(); haptic();
    const card = deck.cards.find((c) => c.id === id)!;
    if (flipped === id) { setFlipped(null); return; }
    setFlipped(id);
    void instruct({ ne: `${card.title.ne}। ${card.fact.ne}`, en: `${card.title.en}. ${card.fact.en}` });
    if (!s.cardsSeen.includes(key(id))) {
      update((st) => { st.cardsSeen.push(key(id)); });
      if (seenCount + 1 === deck.cards.length && awardSticker(deck.id)) setTimeout(() => setCelebrate(true), 2600);
    }
  };

  return (
    <div class="screen scroll deck-screen">
      <Scenery kind="pahad" />
      <TopBar title={tr(deck.title)} right={<span class="chip">{seenCount}/{deck.cards.length}</span>} />
      <p class="deck-hint">{tr(UI.tapCard)}</p>
      <div class="deck-grid">
        {deck.cards.map((c, i) => {
          const up = flipped === c.id;
          const seen = s.cardsSeen.includes(key(c.id));
          return (
            <button key={c.id} class={`fcard ${up ? 'up' : ''} ${seen ? 'seen' : ''}`} style={{ '--dc': deck.color, animationDelay: `${i * 0.05}s` } as never} onClick={() => flip(c.id)}>
              <span class="fcard-inner">
                <span class="fcard-front">
                  <Pic pic={c.pic} size={76} />
                  <span class={`fcard-title ${s.lang === 'ne' ? 'deva' : ''}`}>{tr(c.title)}</span>
                  {seen && <span class="fcard-tick">✓</span>}
                </span>
                <span class="fcard-back">
                  <span class={`fcard-fact ${s.lang === 'ne' ? 'deva' : ''}`}>{tr(c.fact)}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {celebrate && (
        <Celebration title={UI.newSticker} subtitle={STICKER_BY_ID[deck.id].fact} onNext={() => goBack('/nepal')}>
          <div class="sticker"><Pic pic={STICKER_BY_ID[deck.id].pic} size={96} /></div>
        </Celebration>
      )}
    </div>
  );
}
