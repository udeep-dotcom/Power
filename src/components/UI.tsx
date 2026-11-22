import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { UI, type T } from '../data/i18n';
import { goBack } from '../lib/router';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
import { useStore } from '../lib/store';
import { pick, tr } from '../lib/util';
import { Icon, Stars } from './Art';
import { Habre, type Mood } from './Habre';
import { Confetti } from './Scenery';

export function TopBar({ title, back = '/', right }: { title?: ComponentChildren; back?: string | false; right?: ComponentChildren }) {
  return (
    <div class="topbar">
      {back !== false ? (
        <button class="btn white round" aria-label={tr(UI.back)} onClick={() => { sfx.tap(); goBack(back); }}>
          <Icon name="back" />
        </button>
      ) : <span class="spacer" />}
      <h1>{title}</h1>
      {right ?? <span class="spacer" />}
    </div>
  );
}

/** Habre with a speech bubble. Tapping either replays the line. */
export function HabreSays({ text, mood = 'idle', size = 96, speakOnMount = true, clip }: { text: T; mood?: Mood; size?: number; speakOnMount?: boolean; clip?: string }) {
  const s = useStore();
  useEffect(() => { if (speakOnMount) void instruct(text, clip); }, [text.ne, speakOnMount]);
  return (
    <button class="habre-says" onClick={() => { sfx.tap(); void instruct(text, clip); }} aria-label={text[s.lang]}>
      <Habre size={size} mood={mood} />
      <span class="bubble" key={text.ne}>
        <span class={s.lang === 'ne' ? 'deva' : ''} lang={s.lang}>{text[s.lang]}</span>
      </span>
    </button>
  );
}

/** End-of-activity celebration with stars, confetti and next/again actions. */
export function Celebration({ title, subtitle, stars, onNext, onAgain, children, nextLabel }: {
  title: T; subtitle?: T; stars?: number; onNext: () => void; onAgain?: () => void; children?: ComponentChildren; nextLabel?: T;
}) {
  const s = useStore();
  const [fire, setFire] = useState(0);
  useEffect(() => {
    sfx.fanfare();
    setFire(1);
    void instruct(stars !== undefined && stars < 2 ? UI.great[0] : pick(UI.great));
    if (stars) for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i * 2), 450 + i * 280);
  }, []);
  return (
    <div class="overlay">
      <Confetti fire={fire} />
      <div class="card celebrate">
        <Habre size={110} mood="happy" />
        <h2 class={s.lang === 'ne' ? 'deva' : ''}>{tr(title)}</h2>
        {subtitle && <p>{tr(subtitle)}</p>}
        {stars !== undefined && (
          <div class="big-stars">
            {[0, 1, 2].map((i) => <span key={i} style={{ display: 'inline-block', animationDelay: `${0.45 + i * 0.28}s` }} class="star-pop"><Stars n={i < stars ? 1 : 0} of={1} size={60} /></span>)}
          </div>
        )}
        {children}
        <div class="actions">
          {onAgain && <button class="btn white" onClick={() => { sfx.tap(); onAgain(); }}><Icon name="refresh" /> {tr(UI.again)}</button>}
          <button class="btn big" onClick={() => { sfx.tap(); onNext(); }}>{tr(nextLabel ?? UI.next)} <Icon name="next" /></button>
        </div>
      </div>
    </div>
  );
}

/** Small progress dots for multi-round games. */
export function RoundDots({ total, done }: { total: number; done: number }) {
  return (
    <div class="round-dots" aria-label={`${done} / ${total}`}>
      {Array.from({ length: total }, (_, i) => <span key={i} class={i < done ? 'on' : i === done ? 'cur' : ''} />)}
    </div>
  );
}

export function SpeakerButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button class="btn sky round speaker" aria-label={label ?? 'Play sound'} onClick={() => { sfx.tap(); onClick(); }}>
      <Icon name="speaker" />
    </button>
  );
}
