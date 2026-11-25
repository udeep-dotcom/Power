// A reusable "hear it → touch the right picture" game used by the phonics activities (minimal
// pairs, sound hunt, sound friends). Each round can show a feature hint after a correct answer
// (e.g. "भ has a big puff of air 🕯️"), and has a 🐢 button to hear the prompt slowly.

import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { T } from '../data/i18n';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
import { haptic, sleep } from '../lib/util';
import { Bi } from './Bi';
import { Pic } from './Art';
import { HabreSays, RoundDots, SpeakerButton } from './UI';

export interface PickOption { id: string; pic: string; label?: string }
export interface PickRound {
  key: string;
  prompt: (slow?: boolean) => Promise<unknown>;
  show?: ComponentChildren;
  options: PickOption[];
  answer: string;
  after?: T;
}

export function PickGame({ rounds, howto, onFinish }: { rounds: PickRound[]; howto: T; onFinish: (mistakes: number) => void }) {
  const [i, setI] = useState(0);
  const [marks, setMarks] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [hint, setHint] = useState<T | null>(null);
  const mistakes = useRef(0);
  const locked = useRef(false);
  const r = rounds[i];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sleep(300);
      if (i === 0) await instruct(howto);
      if (!cancelled) void r.prompt();
    })();
    return () => { cancelled = true; };
  }, [i]);

  const choose = async (id: string) => {
    if (locked.current) return;
    if (id === r.answer) {
      locked.current = true;
      sfx.correct(); haptic('success');
      setMarks({ [id]: 'correct' });
      if (r.after) { setHint(r.after); await instruct(r.after); } else await r.prompt();
      await sleep(500);
      setMarks({}); setHint(null); locked.current = false;
      if (i + 1 >= rounds.length) onFinish(mistakes.current);
      else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      mistakes.current++;
      setMarks((m) => ({ ...m, [id]: 'wrong' }));
      setTimeout(() => setMarks((m) => { const n = { ...m }; delete n[id]; return n; }), 600);
      setTimeout(() => void r.prompt(), 650); // hear it again after a miss
    }
  };

  return (
    <div class="game-body">
      <HabreSays text={howto} size={64} speakOnMount={false} />
      <RoundDots total={rounds.length} done={i} />
      <div class="prompt card pick-prompt" key={r.key} data-target={r.answer}>
        <SpeakerButton onClick={() => void r.prompt()} />
        {r.show ?? <span class="listen-wave"><i /><i /><i /><i /><i /></span>}
        <button class="btn white round slow-btn" aria-label="slow" onClick={() => { sfx.tap(); void r.prompt(true); }}><Pic pic="🐢" size={30} /></button>
      </div>
      {hint && <p class="pick-hint card"><Bi t={hint} /></p>}
      <div class={`choice-grid pics n${r.options.length}`}>
        {r.options.map((o) => (
          <button key={`${r.key}-${o.id}`} data-id={o.id} class={`tile choice pic-choice ${marks[o.id] ?? ''}`} onClick={() => choose(o.id)} aria-label={o.label ?? o.id}>
            <Pic pic={o.pic} size={84} />
            {o.label && <span class="pic-label" lang={/[ऀ-ॿ]/.test(o.label) ? 'ne' : 'en'}>{o.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
