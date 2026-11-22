// Hand-built SVG art: the Nepal flag (constitutional construction), the Danfe (national bird),
// the hexagon for ष, and the <Pic> resolver that turns content `pic` keys into visuals.

import { EMOJI } from '../data/emoji.generated';
import { Habre } from './Habre';

// ── Nepal flag ──
// Geometry follows Schedule 1 of the Constitution of Nepal (unit AB = 100, y downward):
//   A(0,133.3) B(100,133.3) E(29.3,62.6) G(100,62.6) C(0,0); moon centre on x=25, sun at (25,98).
function star(cx: number, cy: number, n: number, rOut: number, rIn: number, from = -90, span = 360): string {
  const pts: string[] = [];
  const steps = span === 360 ? n * 2 : n * 2 + 1;
  for (let i = 0; i < steps; i++) {
    const r = i % 2 === 0 ? rIn : rOut;
    const a = ((from + (i * span) / (n * 2)) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
const FLAG_OUTLINE = '0,133.33 100,133.33 29.29,62.62 100,62.62 0,0';
const SUN = star(25, 97.97, 12, 17, 10.6);
const MOON_RAYS = star(25, 34.5, 8, 13.5, 8.6, 180, 180);

export function NepalFlag({ size = 64, wave = false }: { size?: number; wave?: boolean }) {
  return (
    <svg class={wave ? 'flag wave' : 'flag'} width={size * 0.86} height={size} viewBox="-8 -13 132 154" role="img" aria-label="Flag of Nepal">
      <defs>
        <mask id="moon-cut">
          <rect x="-10" y="-20" width="80" height="80" fill="#fff" />
          <circle cx="25" cy="28.5" r="13.2" fill="#000" />
        </mask>
      </defs>
      <polygon points={FLAG_OUTLINE} fill="#003893" stroke="#003893" stroke-width="13" stroke-linejoin="miter" stroke-miterlimit="20" />
      <polygon points={FLAG_OUTLINE} fill="#DC143C" />
      <g fill="#fff">
        <circle cx="25" cy="33" r="15" mask="url(#moon-cut)" />
        <polygon points={MOON_RAYS} />
        <path d="M17.6,34.5 A7.4,7.4 0 0 1 32.4,34.5 Z" />
        <polygon points={SUN} />
        <circle cx="25" cy="97.97" r="10.6" />
      </g>
    </svg>
  );
}

// ── Danfe (Himalayan monal), Nepal's national bird ──
export function Danfe({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Danfe">
      <defs>
        <linearGradient id="df-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b3bb0" /><stop offset="1" stop-color="#16243f" /></linearGradient>
        <linearGradient id="df-head" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2fd39a" /><stop offset="1" stop-color="#0c7a6b" /></linearGradient>
        <linearGradient id="df-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2bb3c8" /><stop offset="1" stop-color="#7a3fc0" /></linearGradient>
      </defs>
      <path d="M30 62 C8 58 4 78 10 90 C20 84 30 80 40 74 Z" fill="#d96a22" />
      <path d="M30 64 C16 64 12 76 15 85 C22 80 30 76 38 72 Z" fill="#f29a3a" />
      <line x1="48" y1="80" x2="44" y2="94" stroke="#8a8a96" stroke-width="3.5" stroke-linecap="round" />
      <line x1="60" y1="80" x2="62" y2="94" stroke="#8a8a96" stroke-width="3.5" stroke-linecap="round" />
      <ellipse cx="52" cy="64" rx="26" ry="19" fill="url(#df-body)" />
      <path d="M36 58 C46 46 66 48 72 60 C62 70 46 72 36 58 Z" fill="url(#df-wing)" />
      <path d="M44 56 C52 52 60 53 66 58" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M62 52 C64 42 66 38 70 34 L78 40 C74 46 72 50 70 56 Z" fill="#c9752a" />
      <circle cx="73" cy="31" r="12" fill="url(#df-head)" />
      <g stroke="#1fa36b" stroke-width="1.6" stroke-linecap="round">
        <line x1="72" y1="20" x2="66" y2="9" /><line x1="74" y1="20" x2="73" y2="7" /><line x1="76" y1="20" x2="80" y2="8" />
      </g>
      <g fill="#2fd39a"><ellipse cx="65.5" cy="8" rx="2.4" ry="3.4" /><ellipse cx="73" cy="6" rx="2.4" ry="3.4" /><ellipse cx="80.5" cy="7" rx="2.4" ry="3.4" /></g>
      <circle cx="77" cy="30" r="4.6" fill="#36b8ff" />
      <circle cx="77.6" cy="29.6" r="2.4" fill="#111" />
      <circle cx="78.4" cy="28.8" r=".9" fill="#fff" />
      <path d="M84 31 L92 34 L84 36 Z" fill="#9a9aa6" />
    </svg>
  );
}

export function Hexagon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Hexagon">
      <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="#ffb11b" stroke="#d9870a" stroke-width="6" stroke-linejoin="round" />
      <polygon points="50,18 78,34 78,48 50,32 22,48 22,34" fill="#fff" opacity=".35" />
    </svg>
  );
}

/** Render a content `pic` key at a given pixel size. */
export function Pic({ pic, size = 64, class: cls = '' }: { pic: string; size?: number; class?: string }) {
  if (pic === 'flag') return <span class={`pic ${cls}`} style={{ width: size, height: size, display: 'inline-flex', justifyContent: 'center' }}><NepalFlag size={size} /></span>;
  if (pic === 'danfe') return <span class={`pic ${cls}`}><Danfe size={size} /></span>;
  if (pic === 'hex') return <span class={`pic ${cls}`}><Hexagon size={size} /></span>;
  if (pic === 'habre') return <span class={`pic ${cls}`} style={{ width: size, height: size, display: 'inline-block' }}><Habre size={size} face /></span>;
  if (pic.startsWith('txt:')) {
    const t = pic.slice(4);
    return <span class={`pic pic-txt ${cls}`} lang="ne" style={{ width: size, height: size, fontSize: size * (t.length > 1 ? 0.45 : 0.68) }}>{t}</span>;
  }
  if (pic.startsWith('swatch:')) return <span class={`pic pic-swatch ${cls}`} style={{ width: size * 0.86, height: size * 0.86, background: pic.slice(7) }} />;
  const src = EMOJI[pic];
  if (src) return <img class={`pic ${cls}`} src={src} width={size} height={size} alt="" draggable={false} />;
  return <span class={`pic ${cls}`} style={{ fontSize: size * 0.8, lineHeight: 1 }}>{pic}</span>;
}

export function Star({ filled = true }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3 6.2 20.4l1.2-6.5L2.6 9.4l6.5-.8z"
        fill={filled ? '#ffc21a' : '#e9ddc8'} stroke={filled ? '#e89a00' : '#d6c7ad'} stroke-width="1.4" stroke-linejoin="round" />
      {filled && <path d="M9.4 9.6 L12 4.8 L13 8" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" fill="none" stroke-linecap="round" />}
    </svg>
  );
}

export function Stars({ n, of = 3, size = 22 }: { n: number; of?: number; size?: number }) {
  return (
    <span class="stars" style={{ fontSize: size }} aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => <Star key={i} filled={i < n} />)}
    </span>
  );
}

// Simple line icons (consistent stroke style)
export function Icon({ name, size = 30 }: { name: 'back' | 'speaker' | 'lock' | 'home' | 'refresh' | 'check' | 'gear' | 'next'; size?: number }) {
  const p = { fill: 'none', stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round' as const, 'stroke-linejoin': 'round' as const };
  return (
    <svg class="ico" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {name === 'back' && <path {...p} d="M19 7 L10 16 L19 25" />}
      {name === 'next' && <path {...p} d="M13 7 L22 16 L13 25" />}
      {name === 'speaker' && <><path {...p} d="M5 12 H10 L16 7 V25 L10 20 H5 Z" fill="currentColor" /><path {...p} d="M20.5 11.5 a6 6 0 0 1 0 9 M24 8 a11 11 0 0 1 0 16" /></>}
      {name === 'lock' && <><rect {...p} x="7" y="14" width="18" height="13" rx="3" fill="currentColor" /><path {...p} d="M11 14 V10 a5 5 0 0 1 10 0 V14" /></>}
      {name === 'home' && <path {...p} d="M5 15 L16 6 L27 15 M8 13 V26 H24 V13" />}
      {name === 'refresh' && <path {...p} d="M25 16 a9 9 0 1 1 -3 -6.7 M25 5 V10 H20" />}
      {name === 'check' && <path {...p} d="M7 17 L13 23 L25 9" />}
      {name === 'gear' && <><circle {...p} cx="16" cy="16" r="4" /><path {...p} d="M16 4 V8 M16 24 V28 M4 16 H8 M24 16 H28 M7.5 7.5 L10.3 10.3 M21.7 21.7 L24.5 24.5 M7.5 24.5 L10.3 21.7 M21.7 10.3 L24.5 7.5" /></>}
    </svg>
  );
}
