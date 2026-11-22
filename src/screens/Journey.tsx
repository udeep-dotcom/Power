import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Icon, NepalFlag, Pic, Stars } from '../components/Art';
import { Habre } from '../components/Habre';
import { TopBar } from '../components/UI';
import { LETTER_BY_ID } from '../data/alphabet';
import { UI } from '../data/i18n';
import { GAME_META, JOURNEY, REGIONS, STICKER_BY_ID, type Region } from '../data/journey';
import { navigate } from '../lib/router';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
import { currentNodeIndex, isNodeUnlocked, useStore } from '../lib/store';
import { haptic, tr } from '../lib/util';

const ROW = 104;
const BANNER = 150;
const TOP_PAD = 230;
const BOTTOM_PAD = 120;

const DECOR: Record<Region, string[]> = {
  terai: ['🌾', '🦏', '🐘', '🌳', '🐅'],
  pahad: ['🛕', '🐒', '🌳', '🏯', '🐐'],
  himal: ['🏔️', '🐆', '🦬', '⛺', '❄️'],
};

interface Item { kind: 'node' | 'banner'; y: number; x: number; idx: number; region: Region }

export function Journey() {
  const s = useStore();
  const scroller = useRef<HTMLDivElement>(null);
  const [shake, setShake] = useState(-1);
  const cur = currentNodeIndex(s);

  // Lay out from the bottom (Terai) upwards (Himalaya).
  const { items, height } = useMemo(() => {
    const out: Item[] = [];
    let y = BOTTOM_PAD;
    let lastRegion: Region | null = null;
    JOURNEY.forEach((n, i) => {
      if (n.unit.region !== lastRegion) {
        out.push({ kind: 'banner', y: y + BANNER / 2 - 20, x: 50, idx: i, region: n.unit.region });
        y += BANNER;
        lastRegion = n.unit.region;
      }
      out.push({ kind: 'node', y: y + ROW / 2, x: 50 + 26 * Math.sin(i * 0.82), idx: i, region: n.unit.region });
      y += ROW;
    });
    return { items: out, height: y + TOP_PAD };
  }, []);

  const nodes = items.filter((it) => it.kind === 'node');
  const pathD = nodes.map((it, k) => {
    const yy = height - it.y;
    if (k === 0) return `M${it.x},${yy}`;
    const prev = nodes[k - 1], py = height - prev.y, my = (py + yy) / 2;
    return `C${prev.x},${my} ${it.x},${my} ${it.x},${yy}`;
  }).join(' ');
  const curItem = nodes[cur];
  const donePath = nodes.slice(0, cur + 1).map((it, k, arr) => {
    const yy = height - it.y;
    if (k === 0) return `M${it.x},${yy}`;
    const prev = arr[k - 1], py = height - prev.y, my = (py + yy) / 2;
    return `C${prev.x},${my} ${it.x},${my} ${it.x},${yy}`;
  }).join(' ');

  useEffect(() => {
    const el = scroller.current;
    if (!el || !curItem) return;
    el.scrollTop = height - curItem.y - el.clientHeight * 0.55;
  }, []);

  const open = (i: number) => {
    const n = JOURNEY[i];
    if (!isNodeUnlocked(s, i)) {
      sfx.wrong(); haptic('error'); setShake(i); setTimeout(() => setShake(-1), 500);
      void instruct(UI.locked);
      return;
    }
    sfx.tap(); haptic();
    if (n.kind === 'letter') navigate(`/learn/${n.letterId}/j`);
    else if (n.kind === 'game') navigate(`/game/${n.unit.id}`);
    else navigate(`/chest/${n.unit.id}`);
  };

  // Sky-to-plains gradient spanning the whole path.
  const bg = `linear-gradient(to top, #b7e48f 0%, #d9f3b9 ${pct(items, 'pahad', height) - 4}%, #9ed7a9 ${pct(items, 'pahad', height)}%, #cdebd3 ${pct(items, 'himal', height) - 4}%, #c3dcf5 ${pct(items, 'himal', height)}%, #f4f9ff 92%, #ffffff 100%)`;

  return (
    <div class="screen journey">
      <div class="journey-top"><TopBar title={tr(UI.play)} /></div>
      <div class="journey-scroll" ref={scroller}>
        <div class="journey-map" style={{ height, background: bg }}>
          {/* summit goal */}
          <div class="summit" style={{ top: 70 }}>
            <Pic pic="🏔️" size={120} />
            <span class="summit-flag"><NepalFlag size={46} wave /></span>
          </div>
          <svg class="journey-path" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
            <path d={pathD} class="trail" vector-effect="non-scaling-stroke" />
            <path d={donePath} class="trail-done" vector-effect="non-scaling-stroke" />
          </svg>

          {items.map((it, k) => {
            if (it.kind === 'banner') {
              const r = REGIONS[it.region];
              return (
                <div key={`b${k}`} class="region-banner" style={{ top: height - it.y - 40 }}>
                  <span class="deva" lang="ne">{r.name.ne}</span>
                  <small>{tr(r.blurb)}</small>
                </div>
              );
            }
            const n = JOURNEY[it.idx];
            const stars = s.nodes[n.key] ?? 0;
            const unlocked = isNodeUnlocked(s, it.idx);
            const isCur = it.idx === cur && !stars;
            const decor = DECOR[it.region][it.idx % 5];
            const decorLeft = it.x > 50;
            return (
              <div key={n.key}>
                {it.idx % 2 === 0 && (
                  <span class="decor" style={{ top: height - it.y - 30, [decorLeft ? 'left' : 'right']: '4%' }}><Pic pic={decor} size={54} /></span>
                )}
                <button
                  class={`jnode ${n.kind} ${stars ? 'done' : ''} ${unlocked ? '' : 'locked'} ${isCur ? 'current' : ''} ${shake === it.idx ? 'shake' : ''}`}
                  style={{ left: `${it.x}%`, top: height - it.y }}
                  onClick={() => open(it.idx)}
                  aria-label={n.kind === 'letter' ? LETTER_BY_ID[n.letterId!].char : n.kind}
                >
                  <span class="jnode-face">
                    {!unlocked ? <Icon name="lock" size={28} />
                      : n.kind === 'letter' ? <span class="deva" lang="ne">{LETTER_BY_ID[n.letterId!].char}</span>
                      : n.kind === 'game' ? <Pic pic={GAME_META[n.unit.game].pic} size={40} />
                      : <Pic pic={stars ? STICKER_BY_ID[n.unit.sticker].pic : '🎁'} size={42} />}
                  </span>
                  {stars > 0 && n.kind !== 'chest' && <span class="jnode-stars"><Stars n={stars} size={17} /></span>}
                </button>
                {isCur && (
                  <span class="jnode-habre" style={{ left: `calc(${it.x}% + ${it.x > 50 ? -118 : 46}px)`, top: height - it.y - 62 }}>
                    <Habre size={70} mood="wave" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function pct(items: Item[], region: Region, height: number): number {
  const b = items.find((it) => it.kind === 'banner' && it.region === region);
  return b ? Math.round(((b.y - 30) / height) * 100) : 50;
}
