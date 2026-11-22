// रङ भर — colouring pages of Nepal: our flag, the Danfe, Lali Gurans and a pagoda temple.
// Tap a colour, tap a region. Each child's artwork is saved. The flag page knows the real
// colours and celebrates when the child gets them right.

import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Bi } from '../../components/Bi';
import { FLAG_OUTLINE, MOON_RAYS, Pic, SUN } from '../../components/Art';
import { Confetti, Scenery } from '../../components/Scenery';
import { HabreSays, TopBar } from '../../components/UI';
import { UI, type T } from '../../data/i18n';
import { navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { instruct } from '../../lib/speech';
import { awardSticker, update, useStore } from '../../lib/store';
import { haptic, tileVars } from '../../lib/util';

type El = 'path' | 'ellipse' | 'circle' | 'polygon' | 'rect';
interface Region { id: string; el: El; a: Record<string, string | number>; strokeFill?: boolean }
interface Page { id: string; title: T; viewBox: string; stroke: number; regions: Region[]; decor?: (s: number) => JSX.Element }

export const PALETTE = ['#dc143c', '#1d4fb0', '#ffffff', '#ffc21a', '#ff8c1a', '#2fa36b', '#ff7ab6', '#8e5bd6', '#8d5a3b', '#23223a'];
const OUTLINE = '#3b2a20';

export const PAGES: Page[] = [
  {
    id: 'flag', title: { ne: 'हाम्रो झण्डा', en: 'Our flag' }, viewBox: '-10 -15 136 158', stroke: 1.4,
    regions: [
      // the border is the outline polygon drawn with a thick stroke in the same colour
      { id: 'border', el: 'polygon', a: { points: FLAG_OUTLINE, 'stroke-width': 13, 'stroke-linejoin': 'miter', 'stroke-miterlimit': 20 }, strokeFill: true },
      { id: 'body', el: 'polygon', a: { points: FLAG_OUTLINE } },
      { id: 'moon', el: 'path', a: { d: `M12.24,25.11 A15,15 0 1 0 37.76,25.11 A13.2,13.2 0 1 1 12.24,25.11 Z M17.6,34.5 A7.4,7.4 0 0 1 32.4,34.5 Z` } },
      { id: 'moonrays', el: 'polygon', a: { points: MOON_RAYS } },
      { id: 'sun', el: 'polygon', a: { points: SUN } },
    ],
  },
  {
    id: 'danfe', title: { ne: 'डाँफे', en: 'Danfe' }, viewBox: '0 0 100 100', stroke: 1.2,
    regions: [
      { id: 'tail', el: 'path', a: { d: 'M30 62 C8 58 4 78 10 90 C20 84 30 80 40 74 Z' } },
      { id: 'tail2', el: 'path', a: { d: 'M30 64 C16 64 12 76 15 85 C22 80 30 76 38 72 Z' } },
      { id: 'body', el: 'ellipse', a: { cx: 52, cy: 64, rx: 26, ry: 19 } },
      { id: 'wing', el: 'path', a: { d: 'M36 58 C46 46 66 48 72 60 C62 70 46 72 36 58 Z' } },
      { id: 'neck', el: 'path', a: { d: 'M62 52 C64 42 66 38 70 34 L78 40 C74 46 72 50 70 56 Z' } },
      { id: 'head', el: 'circle', a: { cx: 73, cy: 31, r: 12 } },
      { id: 'crest1', el: 'ellipse', a: { cx: 65.5, cy: 9, rx: 3, ry: 4 } },
      { id: 'crest2', el: 'ellipse', a: { cx: 73, cy: 7, rx: 3, ry: 4 } },
      { id: 'crest3', el: 'ellipse', a: { cx: 80.5, cy: 8, rx: 3, ry: 4 } },
      { id: 'eye', el: 'circle', a: { cx: 77, cy: 30, r: 4.6 } },
      { id: 'beak', el: 'path', a: { d: 'M84 31 L92 34 L84 36 Z' } },
    ],
    decor: (s) => (
      <g stroke={OUTLINE} stroke-width={s} stroke-linecap="round" fill="none" pointer-events="none">
        <line x1="72" y1="20" x2="66" y2="12" /><line x1="73.5" y1="19" x2="73" y2="11" /><line x1="75" y1="20" x2="80" y2="12" />
        <line x1="48" y1="82" x2="44" y2="94" /><line x1="60" y1="82" x2="62" y2="94" />
        <circle cx="77.6" cy="29.6" r="1.8" fill={OUTLINE} />
      </g>
    ),
  },
  {
    id: 'laligurans', title: { ne: 'लालीगुराँस', en: 'Rhododendron' }, viewBox: '0 0 200 200', stroke: 2.4,
    regions: [
      { id: 'stem', el: 'rect', a: { x: 96, y: 112, width: 8, height: 74, rx: 4 } },
      { id: 'leaf1', el: 'ellipse', a: { cx: 62, cy: 150, rx: 36, ry: 14, transform: 'rotate(-28 62 150)' } },
      { id: 'leaf2', el: 'ellipse', a: { cx: 138, cy: 150, rx: 36, ry: 14, transform: 'rotate(28 138 150)' } },
      { id: 'leaf3', el: 'ellipse', a: { cx: 100, cy: 176, rx: 30, ry: 11 } },
      ...[0, 1, 2, 3, 4].map((i): Region => ({ id: `petal${i}`, el: 'ellipse', a: { cx: 100, cy: 56, rx: 24, ry: 34, transform: `rotate(${i * 72} 100 90)` } })),
      { id: 'centre', el: 'circle', a: { cx: 100, cy: 90, r: 16 } },
    ],
    decor: (s) => (
      <g stroke={OUTLINE} stroke-width={s * 0.7} stroke-linecap="round" pointer-events="none">
        {[-30, 0, 30].map((a) => <line key={a} x1="100" y1="90" x2={100 + 26 * Math.sin((a * Math.PI) / 180)} y2={90 - 26 * Math.cos((a * Math.PI) / 180)} />)}
      </g>
    ),
  },
  {
    id: 'mandir', title: { ne: 'मन्दिर', en: 'Pagoda temple' }, viewBox: '0 0 200 222', stroke: 2.4,
    regions: [
      { id: 'sun', el: 'circle', a: { cx: 172, cy: 28, r: 16 } },
      { id: 'ground', el: 'rect', a: { x: 0, y: 206, width: 200, height: 16 } },
      { id: 'base', el: 'rect', a: { x: 28, y: 188, width: 144, height: 18 } },
      { id: 'wall1', el: 'rect', a: { x: 54, y: 148, width: 92, height: 40 } },
      { id: 'door', el: 'path', a: { d: 'M88 188 L88 166 Q100 154 112 166 L112 188 Z' } },
      { id: 'roof1', el: 'polygon', a: { points: '52,122 148,122 184,150 16,150' } },
      { id: 'wall2', el: 'rect', a: { x: 66, y: 100, width: 68, height: 22 } },
      { id: 'roof2', el: 'polygon', a: { points: '64,76 136,76 166,102 34,102' } },
      { id: 'wall3', el: 'rect', a: { x: 78, y: 56, width: 44, height: 20 } },
      { id: 'roof3', el: 'polygon', a: { points: '80,36 120,36 146,58 54,58' } },
      { id: 'gajur', el: 'polygon', a: { points: '100,6 109,36 91,36' } },
    ],
  },
];

const PAGE_BY_ID: Record<string, Page> = Object.fromEntries(PAGES.map((p) => [p.id, p]));

/** The real flag: is this child's flag coloured correctly? */
export function flagIsCorrect(f: Record<string, string>): boolean {
  return f.border === '#1d4fb0' && f.body === '#dc143c' && f.moon === '#ffffff' && f.moonrays === '#ffffff' && f.sun === '#ffffff';
}

function Drawing({ page, fills, onTap, small = false }: { page: Page; fills: Record<string, string>; onTap?: (id: string) => void; small?: boolean }) {
  return (
    <svg class={`colour-svg ${small ? 'small' : ''}`} viewBox={page.viewBox} role="img" aria-label={page.title.en}>
      {/* flag: a slightly wider dark stroke underneath leaves a thin outline at the border's outer edge */}
      {page.id === 'flag' && <polygon points={FLAG_OUTLINE} fill="none" stroke={OUTLINE} stroke-width={13 + page.stroke * 2} stroke-linejoin="miter" stroke-miterlimit="20" pointer-events="none" />}
      {page.regions.map((r) => {
        const colour = fills[r.id] ?? '#ffffff';
        const props = {
          ...r.a, key: r.id, class: onTap ? 'region' : '', fill: colour,
          stroke: r.strokeFill ? colour : OUTLINE,
          'stroke-width': r.strokeFill ? r.a['stroke-width'] : page.stroke,
          onPointerDown: onTap ? () => onTap(r.id) : undefined,
        };
        const Tag = r.el as unknown as preact.FunctionComponent<Record<string, unknown>>;
        return <Tag {...props} />;
      })}
      {/* black outline over the flag's border band so it reads as a colouring page */}
      {page.id === 'flag' && <polygon points={FLAG_OUTLINE} fill="none" stroke={OUTLINE} stroke-width={page.stroke} pointer-events="none" />}
      {page.decor?.(page.stroke)}
    </svg>
  );
}

export function ColourPicker() {
  const s = useStore();
  return (
    <div class="screen scroll colour-picker">
      <Scenery kind="home" />
      <TopBar title={<Bi t={UI.colouring} />} />
      <HabreSays text={UI.colourHello} size={70} />
      <div class="hub-grid">
        {PAGES.map((p, i) => (
          <button key={p.id} class="hub-tile colour-thumb" style={{ ...tileVars('tc', ['#dc143c', '#2fa36b', '#e8505b', '#ff9f1c'][i % 4]), animationDelay: `${i * 0.05}s` } as never}
            onClick={() => { sfx.tap(); haptic(); navigate(`/play/colour/${p.id}`); }}>
            <Drawing page={p} fills={s.coloring[p.id] ?? {}} small />
            <span class="hub-title"><Bi t={p.title} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColourPage({ pageId }: { pageId: string }) {
  const s = useStore();
  const page = PAGE_BY_ID[pageId] ?? PAGES[0];
  const fills = s.coloring[page.id] ?? {};
  const [colour, setColour] = useState(PALETTE[0]);
  const [fire, setFire] = useState(0);
  const [praised, setPraised] = useState(flagIsCorrect(fills));

  useEffect(() => { if (page.id === 'flag') void instruct(UI.flagHint); }, []);

  const tap = (id: string) => {
    sfx.pop(); haptic();
    const next = { ...fills, [id]: colour };
    update((st) => { st.coloring = { ...st.coloring, [page.id]: next }; });
    // any colour the child chose counts — white too (the flag's moon and sun ARE white)
    const filled = page.regions.filter((r) => next[r.id] !== undefined).length;
    if (filled >= Math.ceil(page.regions.length * 0.7)) awardSticker('colouring');
    if (page.id === 'flag' && !praised && flagIsCorrect(next)) {
      setPraised(true); setFire((n) => n + 1); sfx.fanfare(); void instruct(UI.flagDone);
    }
  };

  return (
    <div class="screen colour-screen">
      <Scenery kind="home" />
      <TopBar title={<Bi t={page.title} />} right={
        <button class="btn white round" aria-label={UI.clearPage.en} onClick={() => { sfx.whoosh(); setPraised(false); update((st) => { st.coloring = { ...st.coloring, [page.id]: {} }; }); }}>
          <Pic pic="🧽" size={28} />
        </button>
      } />
      <div class="colour-canvas card"><Drawing page={page} fills={fills} onTap={tap} /></div>
      <div class="palette" role="radiogroup" aria-label="colours">
        {PALETTE.map((c) => (
          <button key={c} role="radio" aria-checked={c === colour} class={`swatch-btn ${c === colour ? 'on' : ''}`} style={{ background: c }}
            onClick={() => { sfx.tap(); setColour(c); }} aria-label={c} />
        ))}
      </div>
      <Confetti fire={fire} />
    </div>
  );
}
