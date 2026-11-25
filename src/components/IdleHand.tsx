// "Show, don't tell": children under 6 can't read instructions in ANY language, and a child abroad
// may not understand Habre's Nepali. When nothing has been touched for a few seconds, a hand
// appears over the thing to do next and mimes it (tap, slide, draw). The second time, Habre also
// repeats the instruction. It never points at an answer, and stops after three times per screen.

import { useEffect, useRef, useState } from 'preact/hooks';
import { Pic } from './Art';

type Mode = 'tap' | 'slide' | 'draw';
/** Route → what to point at. First match wins; selectors pick the first visible element. */
const HINTS: [RegExp, string, Mode][] = [
  [/^start$/, '.start-play, .player', 'tap'],
  [/^\/$/, '.journey-hero', 'tap'],
  [/^\/journey/, '.jnode.current', 'tap'],
  [/^\/learn\/[^/]+/, '.lesson-next, .trace-pad, .prompt .speaker', 'tap'],
  [/^\/(game|practice|words\/[^/]+\/game|numbers\/game|barakhari-game)/, '.prompt .speaker, .count-thing, .mcard:not(.up)', 'tap'],
  [/^\/sounds\/blend\//, '.blend-card:not(.done) .blend-track', 'slide'],
  [/^\/(sounds\/pairs|abc\/hunt|sounds\/friends\/game)/, '.pick-prompt .speaker', 'tap'],
  [/^\/sounds\/mouth/, '.vt-cell', 'tap'],
  [/^\/sounds\/friends$/, '.friend-pair', 'tap'],
  [/^\/abc\/[a-z]$/, '.abc-big', 'tap'],
  [/^\/abc$/, '.abc-tile', 'tap'],
  [/^\/letters/, '.ltile', 'tap'],
  [/^\/barakhari/, '.bk-tile', 'tap'],
  [/^\/words\/[^/]+$/, '.word-tile', 'tap'],
  [/^\/numbers$/, '.num-tile', 'tap'],
  [/^\/stories\/[^/]+/, '.story-nav .big-arrow:last-child', 'tap'],
  [/^\/stories$/, '.book', 'tap'],
  [/^\/play\/music/, '.hit, .damphu, .bell-btn', 'tap'],
  [/^\/play\/colour\/[^/]+/, '.swatch-btn', 'tap'],
  [/^\/nepal\/map/, '.prov', 'tap'],
  [/^\/(sounds|play|nepal|words|play\/colour)$/, '.hub-tile', 'tap'],
];

const FIRST_DELAY = 6000;
const NEXT_DELAY = 9000;
const MAX_SHOWS = 3;

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
    && !(el as HTMLButtonElement).disabled;
}

export function IdleHand({ path }: { path: string }) {
  const [hand, setHand] = useState<{ x: number; y: number; w: number; mode: Mode; n: number } | null>(null);
  const shows = useRef(0);

  useEffect(() => {
    shows.current = 0;
    setHand(null);
    const hint = HINTS.find(([re]) => re.test(path));
    if (!hint) return;
    let timer = 0;
    const arm = (ms: number) => { clearTimeout(timer); timer = window.setTimeout(show, ms); };
    function show() {
      if (shows.current >= MAX_SHOWS || document.querySelector('.overlay, .celebrate')) return;
      const el = [...document.querySelectorAll(hint![1])].find(visible);
      if (!el) { arm(NEXT_DELAY); return; }
      const r = el.getBoundingClientRect();
      shows.current++;
      setHand({ x: hint![2] === 'slide' ? r.left : r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, mode: hint![2], n: shows.current });
      // second time: Habre says the instruction again (in the language this child is spoken to in)
      if (shows.current === 2) (document.querySelector('.screen .habre-says') as HTMLElement | null)?.click();
      arm(NEXT_DELAY);
    }
    const poke = () => { setHand(null); arm(NEXT_DELAY); };
    window.addEventListener('pointerdown', poke, true);
    window.addEventListener('keydown', poke, true);
    window.addEventListener('scroll', poke, true);
    arm(FIRST_DELAY);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', poke, true);
      window.removeEventListener('keydown', poke, true);
      window.removeEventListener('scroll', poke, true);
    };
  }, [path]);

  if (!hand) return null;
  return (
    <div class={`idle-hand ${hand.mode}`} key={hand.n} aria-hidden="true"
      style={{ left: `${hand.x}px`, top: `${hand.y}px`, '--slide': `${Math.max(60, hand.w - 30)}px` } as never}>
      <span class="ih-ring" />
      <span class="ih-finger"><Pic pic="👆" size={54} /></span>
    </div>
  );
}
