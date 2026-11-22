// खेल hub + नेपाली बाजा. Instruments children hear at weddings, festivals and in folk songs,
// played by touch: मादल (two heads), डम्फू, बाँसुरी (six holes = six notes) and the temple
// घण्टी. All sounds are synthesised (src/lib/sfx.ts), so they work offline.

import { useRef, useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { HabreSays, TopBar } from '../../components/UI';
import { UI, type T } from '../../data/i18n';
import { navigate } from '../../lib/router';
import { BANSURI_NOTES, instruments, sfx } from '../../lib/sfx';
import { say } from '../../lib/speech';
import { awardSticker } from '../../lib/store';
import { haptic, tileVars } from '../../lib/util';

export function PlayHub() {
  const tiles = [
    { path: '/play/music', pic: '🥁', title: UI.instruments, color: '#d9452b' },
    { path: '/play/colour', pic: '🖍️', title: UI.colouring, color: '#8e5bd6' },
  ];
  return (
    <div class="screen scroll play-hub">
      <Scenery kind="home" />
      <TopBar title={<Bi t={UI.playHub} />} />
      <HabreSays text={UI.playHello} size={80} />
      <div class="hub-grid two">
        {tiles.map((t, i) => (
          <button key={t.path} class="hub-tile tall" style={{ ...tileVars('tc', t.color), animationDelay: `${i * 0.06}s` } as never}
            onClick={() => { sfx.tap(); haptic(); navigate(t.path); }}>
            <span class="hub-pic big"><Pic pic={t.pic} size={84} /></span>
            <span class="hub-title"><Bi t={t.title} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

const NAMES: Record<string, T> = {
  madal: { ne: 'मादल', en: 'Madal drum' },
  damphu: { ne: 'डम्फू', en: 'Damphu drum' },
  bansuri: { ne: 'बाँसुरी', en: 'Bansuri flute' },
  bell: { ne: 'घण्टी', en: 'Temple bell' },
};

export function MusicScreen() {
  const named = useRef(new Set<string>());
  const taps = useRef(0);
  const [notes, setNotes] = useState<{ id: number; x: number; y: number; c: string }[]>([]);
  const [swing, setSwing] = useState(0);
  const nid = useRef(0);

  const played = (key: string, e: PointerEvent) => {
    haptic();
    window.dispatchEvent(new CustomEvent('akshar:react', { detail: 'happy' }));
    // Say the instrument's name the first time it's played on this visit.
    if (!named.current.has(key)) { named.current.add(key); setTimeout(() => void say(NAMES[key].ne), 350); }
    taps.current++;
    if (taps.current === 15) awardSticker('music');
    const host = (e.currentTarget as Element).closest('.music-stage')!.getBoundingClientRect();
    const id = ++nid.current;
    const c = ['#dc143c', '#1d4fb0', '#ffb11b', '#2fa36b', '#8e5bd6'][id % 5];
    setNotes((n) => [...n.slice(-10), { id, x: e.clientX - host.left, y: e.clientY - host.top, c }]);
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 1200);
  };

  return (
    <div class="screen scroll music-screen">
      <Scenery kind="home" />
      <TopBar title={<Bi t={UI.instruments} />} />
      <HabreSays text={UI.instrumentsHello} size={64} />
      <div class="music-stage">
        <div class="instr card wide">
          <svg viewBox="0 0 300 130" class="madal" role="img" aria-label="Madal">
            <path d="M40 30 Q150 6 260 30 L260 100 Q150 124 40 100 Z" fill="#9a5a2c" stroke="#5a3214" stroke-width="4" />
            {[80, 115, 150, 185, 220].map((x) => <path key={x} d={`M${x} 22 L${x} 108`} stroke="#c98a4b" stroke-width="5" opacity=".7" />)}
            <path d="M40 30 Q150 6 260 30 M40 100 Q150 124 260 100" stroke="#e8b04a" stroke-width="5" fill="none" />
            <g class="hit" onPointerDown={(e) => { instruments.madalBass(); played('madal', e as unknown as PointerEvent); }}>
              <ellipse cx="40" cy="65" rx="30" ry="46" fill="#f4dfb8" stroke="#5a3214" stroke-width="5" />
              <ellipse cx="40" cy="65" rx="14" ry="22" fill="#3b2a20" opacity=".85" />
            </g>
            <g class="hit" onPointerDown={(e) => { instruments.madalTreble(); played('madal', e as unknown as PointerEvent); }}>
              <ellipse cx="260" cy="65" rx="24" ry="38" fill="#f4dfb8" stroke="#5a3214" stroke-width="5" />
              <ellipse cx="260" cy="65" rx="10" ry="16" fill="#3b2a20" opacity=".85" />
            </g>
          </svg>
          <span class="instr-name"><Bi t={NAMES.madal} /></span>
        </div>
        <div class="instr card">
          <svg viewBox="0 0 140 140" class="damphu hit" role="img" aria-label="Damphu"
            onPointerDown={(e) => { instruments.damphu(); played('damphu', e as unknown as PointerEvent); }}>
            <circle cx="70" cy="70" r="58" fill="#f4dfb8" stroke="#7a4a22" stroke-width="10" />
            <circle cx="70" cy="70" r="40" fill="none" stroke="#e7c48e" stroke-width="3" />
            {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={70 + 58 * Math.cos((a * Math.PI) / 180)} cy={70 + 58 * Math.sin((a * Math.PI) / 180)} r="5" fill="#dc143c" />)}
          </svg>
          <span class="instr-name"><Bi t={NAMES.damphu} /></span>
        </div>
        <div class="instr card">
          <button class={`bell-btn ${swing ? 'swing' : ''}`} key={swing} aria-label="Bell"
            onPointerDown={(e) => { instruments.bell(); setSwing((n) => n + 1); played('bell', e as unknown as PointerEvent); }}>
            <Pic pic="🔔" size={104} />
          </button>
          <span class="instr-name"><Bi t={NAMES.bell} /></span>
        </div>
        <div class="instr card wide">
          <svg viewBox="0 0 320 70" class="bansuri" role="img" aria-label="Bansuri">
            <rect x="6" y="20" width="308" height="30" rx="15" fill="#e3b866" stroke="#9a6a2a" stroke-width="3" />
            {[40, 110, 200].map((x) => <rect key={x} x={x} y="20" width="6" height="30" fill="#c9952f" />)}
            <circle cx="30" cy="35" r="6" fill="#5a3a14" />
            {BANSURI_NOTES.map((f, k) => (
              <circle key={k} class="hole hit" cx={130 + k * 30} cy="35" r="11" fill="#4a2e10" stroke="#fff3d6" stroke-width="3"
                onPointerDown={(e) => { instruments.bansuri(f); played('bansuri', e as unknown as PointerEvent); }} />
            ))}
          </svg>
          <span class="instr-name"><Bi t={NAMES.bansuri} /></span>
        </div>
        {notes.map((n) => <span key={n.id} class="float-note" style={{ left: n.x, top: n.y, color: n.c }}>♪</span>)}
      </div>
    </div>
  );
}
