// Balloon pop: letters float up on balloons; pop the ones matching the target.
// No time pressure and no penalty for letting balloons escape — only wrong pops count.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Pic } from '../../components/Art';
import { RoundDots, SpeakerButton } from '../../components/UI';
import { LETTER_BY_ID, type Letter } from '../../data/alphabet';
import { UI } from '../../data/i18n';
import { sfx } from '../../lib/sfx';
import { instruct, say } from '../../lib/speech';
import { recordAnswer } from '../../lib/store';
import { distractors, haptic, shuffle, tr, withReview } from '../../lib/util';
import type { GameProps } from './GameScreen';

const GOAL = 6; // pops needed; target changes every 2 pops
const COLORS = ['#ff4d6d', '#4d8dff', '#ffb11b', '#2fc27a', '#a46bff', '#ff7fbf', '#17c3d6'];

interface B { id: number; letter: Letter; x: number; color: string; dur: number; popped?: boolean; wrong?: boolean }

export function Balloon({ letters, onFinish }: GameProps) {
  const targets = useMemo(() => shuffle(letters).slice(0, GOAL / 2).map((id) => LETTER_BY_ID[id]), []);
  const pool = useMemo(() => withReview(letters, 2), []);
  const [hits, setHits] = useState(0);
  const [balloons, setBalloons] = useState<B[]>([]);
  const mistakes = useRef(0);
  const nextId = useRef(1);
  const target = targets[Math.min(targets.length - 1, Math.floor(hits / 2))];
  const done = hits >= GOAL;

  useEffect(() => { void instruct({ ne: `${target.char} भएको बेलुन फुटाऊ!`, en: `Pop the ${target.char} balloons!` }); }, [target.id]);

  useEffect(() => {
    if (done) return;
    const spawn = () => {
      setBalloons((bs) => {
        const live = bs.filter((b) => !b.popped).slice(-9);
        const isTarget = Math.random() < 0.42 || !live.some((b) => b.letter.id === target.id);
        const letter = isTarget ? target : distractors(target, 3, pool)[Math.floor(Math.random() * 3)];
        const x = 8 + Math.random() * 74;
        return [...live, { id: nextId.current++, letter, x, color: COLORS[Math.floor(Math.random() * COLORS.length)], dur: 7 + Math.random() * 3 }];
      });
    };
    spawn();
    const t = setInterval(spawn, 1100);
    return () => clearInterval(t);
  }, [target.id, done]);

  const pop = (b: B) => {
    if (b.popped || done) return;
    if (b.letter.id === target.id) {
      sfx.pop(); haptic('success');
      recordAnswer(target.id, true);
      setBalloons((bs) => bs.map((x) => (x.id === b.id ? { ...x, popped: true } : x)));
      setTimeout(() => setBalloons((bs) => bs.filter((x) => x.id !== b.id)), 450);
      const h = hits + 1;
      setHits(h);
      if (h >= GOAL) setTimeout(() => onFinish(mistakes.current), 700);
    } else {
      sfx.wrong(); haptic('error');
      mistakes.current++;
      recordAnswer(target.id, false);
      setBalloons((bs) => bs.map((x) => (x.id === b.id ? { ...x, wrong: true } : x)));
      setTimeout(() => setBalloons((bs) => bs.map((x) => (x.id === b.id ? { ...x, wrong: false } : x))), 500);
    }
  };

  return (
    <div class="game-body balloon-game">
      <div class="balloon-target card" key={target.id}>
        <span class="lbl">{tr(UI.pop)}</span>
        <span class="deva tgt" lang="ne">{target.char}</span>
        <Pic pic={target.pic} size={44} />
        <SpeakerButton onClick={() => void say(target.say ?? target.char, `letter-${target.id}`)} />
      </div>
      <RoundDots total={GOAL} done={hits} />
      <div class="sky-field">
        {balloons.map((b) => (
          <button key={b.id} data-id={b.letter.id} class={`balloon ${b.popped ? 'popped' : ''} ${b.wrong ? 'wrong' : ''}`}
            style={{ left: `${b.x}%`, animationDuration: `${b.dur}s`, '--bc': b.color } as never}
            onAnimationEnd={(e) => { if ((e as AnimationEvent).animationName === 'rise') setBalloons((bs) => bs.filter((x) => x.id !== b.id)); }}
            onPointerDown={() => pop(b)} aria-label={b.letter.char}>
            <svg viewBox="0 0 80 110" class="balloon-svg" aria-hidden="true">
              <path d="M40 4 C62 4 76 22 76 42 C76 66 56 84 42 88 L46 96 L34 96 L38 88 C24 84 4 66 4 42 C4 22 18 4 40 4 Z" fill="var(--bc)" />
              <ellipse cx="26" cy="26" rx="8" ry="13" fill="#fff" opacity=".35" transform="rotate(25 26 26)" />
              <path d="M40 96 C34 104 46 106 40 112" stroke="#8a7a66" stroke-width="1.5" fill="none" />
            </svg>
            <span class="deva b-letter" lang="ne">{b.letter.char}</span>
            {b.popped && <span class="burst">{Array.from({ length: 8 }, (_, k) => <i key={k} style={{ '--a': `${k * 45}deg` } as never} />)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
