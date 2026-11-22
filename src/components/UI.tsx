import type { ComponentChildren } from 'preact';
import { Bi } from './Bi';
import { useEffect, useState } from 'preact/hooks';
import { UI, type T } from '../data/i18n';
import { goBack } from '../lib/router';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
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

/** Habre's mood for a moment after a right/wrong answer (sfx emits 'akshar:react'). */
function useReaction(base: Mood): Mood {
  const [m, setM] = useState<Mood | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      setM((e as CustomEvent<Mood>).detail);
      clearTimeout(t);
      t = setTimeout(() => setM(null), 1300);
    };
    window.addEventListener('akshar:react', on);
    return () => { window.removeEventListener('akshar:react', on); clearTimeout(t); };
  }, []);
  return m ?? base;
}

/** Habre with a speech bubble (Nepali first). Tapping either replays the line. */
export function HabreSays({ text, mood = 'idle', size = 96, speakOnMount = true, clip, onReplay }: {
  text: T; mood?: Mood; size?: number; speakOnMount?: boolean; clip?: string; onReplay?: () => void;
}) {
  const shown = useReaction(mood);
  useEffect(() => { if (speakOnMount) void instruct(text, clip); }, [text.ne, speakOnMount]);
  return (
    <button class="habre-says" onClick={() => { sfx.tap(); if (onReplay) onReplay(); else void instruct(text, clip); }} aria-label={text.ne}>
      <Habre size={size} mood={shown} key={shown} />
      <span class="bubble" key={text.ne}><Bi t={text} /></span>
    </button>
  );
}

/** End-of-activity celebration with stars, confetti and next/again actions. */
export function Celebration({ title, subtitle, stars, onNext, onAgain, children, nextLabel }: {
  title: T; subtitle?: T; stars?: number; onNext: () => void; onAgain?: () => void; children?: ComponentChildren; nextLabel?: T;
}) {
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
        <h2><Bi t={title} /></h2>
        {subtitle && <p><Bi t={subtitle} /></p>}
        {stars !== undefined && (
          <div class="big-stars">
            {[0, 1, 2].map((i) => <span key={i} style={{ display: 'inline-block', animationDelay: `${0.45 + i * 0.28}s` }} class="star-pop"><Stars n={i < stars ? 1 : 0} of={1} size={60} /></span>)}
          </div>
        )}
        {children}
        <div class="actions">
          {onAgain && <button class="btn white" onClick={() => { sfx.tap(); onAgain(); }}><Icon name="refresh" /> <Bi t={UI.again} /></button>}
          <button class="btn big" onClick={() => { sfx.tap(); onNext(); }}><Bi t={nextLabel ?? UI.next} /> <Icon name="next" /></button>
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
