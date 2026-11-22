// Memory pairs: match each letter with its picture. 4 pairs (8 cards) — enough challenge for
// 5–8 year olds without overwhelming working memory.

import { useMemo, useRef, useState } from 'preact/hooks';
import { level } from '../../lib/level';
import { Pic } from '../../components/Art';
import { HabreSays } from '../../components/UI';
import { LETTER_BY_ID } from '../../data/alphabet';
import { GAME_META } from '../../data/journey';
import { sfx } from '../../lib/sfx';
import { say } from '../../lib/speech';
import { recordAnswer } from '../../lib/store';
import { haptic, shuffle, withReview } from '../../lib/util';
import type { GameProps } from './GameScreen';
import { speakLetter } from '../../components/Word';

interface Card { key: string; letterId: string; face: 'letter' | 'pic' }

export function Memory({ letters, onFinish }: GameProps) {
  const cards = useMemo(() => {
    // Always the unit's own letters first; fill up with weak earlier letters if the unit is small.
    const review = withReview(letters, 4).filter((id) => !letters.includes(id));
    const ids = [...shuffle(letters), ...shuffle(review)].slice(0, level().pairs); // 2–4 pairs by age
    return shuffle(ids.flatMap((id): Card[] => [{ key: `${id}-l`, letterId: id, face: 'letter' }, { key: `${id}-p`, letterId: id, face: 'pic' }]));
  }, []);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const busy = useRef(false);
  const mismatches = useRef(0);

  const flip = (c: Card) => {
    if (busy.current || open.includes(c.key) || matched.includes(c.letterId)) return;
    sfx.flip(); haptic();
    const l = LETTER_BY_ID[c.letterId];
    if (c.face === 'letter') void say(l.say ?? l.char, `letter-${l.id}`); else void say(l.word, `word-${l.id}`);
    const next = [...open, c.key];
    setOpen(next);
    if (next.length === 2) {
      busy.current = true;
      const [a, b] = next.map((k) => cards.find((x) => x.key === k)!);
      if (a.letterId === b.letterId) {
        setTimeout(() => {
          sfx.correct(); haptic('success');
          recordAnswer(a.letterId, true);
          void speakLetter(l);
          const m = [...matched, a.letterId];
          setMatched(m); setOpen([]); busy.current = false;
          if (m.length === cards.length / 2) setTimeout(() => onFinish(Math.floor(mismatches.current / 2)), 900);
        }, 450);
      } else {
        mismatches.current++;
        setTimeout(() => { sfx.wrong(); setOpen([]); busy.current = false; }, 1000);
      }
    }
  };

  return (
    <div class="game-body">
      <HabreSays text={GAME_META.memory.howto} size={72} />
      <div class={`memory-grid p${cards.length / 2}`}>
        {cards.map((c) => {
          const l = LETTER_BY_ID[c.letterId];
          const up = open.includes(c.key) || matched.includes(c.letterId);
          return (
            <button key={c.key} data-id={c.letterId} class={`mcard ${up ? 'up' : ''} ${matched.includes(c.letterId) ? 'matched' : ''}`} onClick={() => flip(c)} aria-label="card">
              <span class="mcard-inner">
                <span class="mcard-back"><span class="mcard-pattern" /></span>
                <span class="mcard-front">
                  {c.face === 'letter' ? <span class="deva" lang="ne">{l.char}</span> : <Pic pic={l.pic} size={54} />}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
