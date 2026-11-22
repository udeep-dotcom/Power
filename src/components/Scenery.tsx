// Layered, animated backdrop: sky, sun, drifting clouds, Himalaya, terraced hills.
import { useEffect, useRef } from 'preact/hooks';

export type SceneKind = 'home' | 'terai' | 'pahad' | 'himal' | 'dusk';

const SKY: Record<SceneKind, string> = {
  home: 'linear-gradient(#7fd0ff 0%, #bfe7ff 45%, #e9f7ff 70%)',
  terai: 'linear-gradient(#8fd8ff 0%, #d4f1ff 55%, #f4fbe9 80%)',
  pahad: 'linear-gradient(#7fcaf5 0%, #c3e8ff 55%, #eef9f2 80%)',
  himal: 'linear-gradient(#5aa9ec 0%, #a9d6fb 50%, #eef6ff 80%)',
  dusk: 'linear-gradient(#ff9a8b 0%, #ffc3a0 40%, #ffe7c7 75%)',
};

function Cloud({ top, dur, delay, scale }: { top: string; dur: number; delay: number; scale: number }) {
  return (
    <svg class="cloud" style={{ top, animationDuration: `${dur}s`, animationDelay: `${delay}s`, width: 130 * scale }} viewBox="0 0 130 60" aria-hidden="true">
      <path d="M22 52 C6 52 4 34 18 30 C18 14 40 8 50 20 C58 4 88 6 92 24 C108 20 122 32 114 46 C112 50 108 52 104 52 Z" fill="#fff" />
      <path d="M22 52 C14 52 10 46 12 40 C26 46 90 48 114 44 C112 50 108 52 104 52 Z" fill="#e4f1fb" />
    </svg>
  );
}

export function Scenery({ kind = 'home' }: { kind?: SceneKind }) {
  const snow = kind === 'himal';
  const flat = kind === 'terai';
  return (
    <div class="scenery" style={{ background: SKY[kind] }} aria-hidden="true">
      <div class="sun" style={kind === 'dusk' ? { top: '30%', background: 'radial-gradient(circle,#fff1c1,#ff8f5a)' } : undefined} />
      <Cloud top="8%" dur={70} delay={-10} scale={1} />
      <Cloud top="18%" dur={95} delay={-55} scale={0.7} />
      <Cloud top="30%" dur={120} delay={-30} scale={0.5} />
      <svg class="land" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice">
        {/* far Himalaya */}
        {!flat && (
          <g>
            <path d="M0 150 L40 96 L62 118 L98 58 L130 104 L160 74 L196 120 L236 40 L272 100 L300 78 L336 118 L368 70 L400 108 L400 260 L0 260 Z" fill={snow ? '#b8d3ef' : '#c4daf0'} />
            <path d="M98 58 L86 78 L96 74 L104 82 L112 70 Z M236 40 L222 64 L234 58 L242 68 L252 56 Z M368 70 L358 86 L368 82 L376 90 Z M160 74 L152 86 L162 84 L168 88 Z M40 96 L32 108 L42 104 Z"
              fill="#fff" />
          </g>
        )}
        {/* mid range */}
        {snow ? (
          <g>
            <path d="M0 190 L50 120 L80 150 L130 88 L170 140 L210 110 L250 150 L300 96 L350 150 L400 120 L400 260 L0 260 Z" fill="#8fb4da" />
            <path d="M130 88 L116 110 L128 104 L138 114 L148 102 Z M300 96 L288 116 L300 110 L310 120 L318 108 Z M50 120 L40 134 L52 130 L58 136 Z" fill="#fff" />
            <path d="M0 220 C60 190 120 210 180 196 C250 180 320 206 400 190 L400 260 L0 260 Z" fill="#eaf3fc" />
            <path d="M0 240 C80 222 160 236 240 226 C300 220 350 232 400 224 L400 260 L0 260 Z" fill="#ffffff" />
          </g>
        ) : (
          <g>
            <path d="M0 196 C40 170 80 160 130 176 C180 150 230 150 270 170 C320 150 360 160 400 176 L400 260 L0 260 Z" fill={flat ? '#a8dc8a' : '#86c98f'} />
            {!flat && (
              <g stroke="#74b97e" stroke-width="2.2" fill="none" opacity=".9">
                <path d="M150 178 C190 164 230 164 262 176" /><path d="M140 188 C190 174 236 176 272 188" /><path d="M134 198 C190 186 240 188 284 200" />
                <path d="M20 194 C50 182 80 178 112 186" /><path d="M14 204 C50 192 90 190 124 198" />
                <path d="M300 172 C330 162 360 164 392 176" /><path d="M292 184 C330 174 366 176 400 186" />
              </g>
            )}
            <path d="M0 222 C70 206 130 214 200 208 C270 202 330 214 400 206 L400 260 L0 260 Z" fill={flat ? '#7cc463' : '#5fae6a'} />
            {/* trees */}
            <g fill={flat ? '#3f9a4d' : '#2f8a4a'}>
              <path d="M40 214 l8 -22 l8 22 Z" /><path d="M58 212 l6 -16 l6 16 Z" /><path d="M338 210 l8 -24 l8 24 Z" /><path d="M356 210 l6 -16 l6 16 Z" />
              {flat && <><circle cx="250" cy="200" r="9" /><rect x="248" y="204" width="4" height="12" fill="#7a5130" /><circle cx="270" cy="204" r="7" /></>}
            </g>
            <path d="M0 244 C90 232 170 240 250 234 C320 230 360 238 400 234 L400 260 L0 260 Z" fill={flat ? '#68b552' : '#4f9e5a'} />
          </g>
        )}
      </svg>
    </div>
  );
}

const LUNGTA = ['#1d63d8', '#ffffff', '#e0283f', '#26a259', '#ffc21a'];

/** Five-colour prayer flags strung across the top of the screen. */
export function PrayerFlags() {
  const n = 15;
  return (
    <svg class="lungta" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 6 Q200 46 400 6" stroke="#8a6a4a" stroke-width="1.5" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const x = t * 400;
        const y = 6 + 40 * t * (1 - t) * 2 * 1; // matches quadratic sag
        return (
          <g key={i} transform={`translate(${x - 9} ${y})`}>
            <rect class="pf" style={{ animationDelay: `${-i * 0.23}s` }} width="18" height="22" rx="1.5" fill={LUNGTA[i % 5]} stroke="rgba(0,0,0,.08)" />
          </g>
        );
      })}
    </svg>
  );
}

// ── Confetti ──
const COLORS = ['#dc143c', '#1d4fb0', '#ffb11b', '#2fa36b', '#8e5bd6', '#ff7aa8', '#ffffff'];

/** Fires a confetti burst whenever `fire` changes to a new truthy value. */
export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fire || !ref.current) return;
    const c = ref.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = (c.width = c.offsetWidth * dpr), h = (c.height = c.offsetHeight * dpr);
    const g = c.getContext('2d')!;
    const parts = Array.from({ length: 130 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h * 0.42,
      vx: (Math.random() - 0.5) * 22 * dpr, vy: (-Math.random() * 20 - 8) * dpr,
      r: (5 + Math.random() * 7) * dpr, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[Math.floor(Math.random() * COLORS.length)], shape: Math.random() < 0.3 ? 1 : 0,
    }));
    let raf = 0, frame = 0;
    const tick = () => {
      frame++;
      g.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.vy += 0.55 * dpr; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c;
        if (p.shape) { g.beginPath(); g.arc(0, 0, p.r * 0.5, 0, Math.PI * 2); g.fill(); }
        else g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2 * (0.6 + 0.4 * Math.sin(frame * 0.2 + p.rot)));
        g.restore();
      }
      if (frame < 150) raf = requestAnimationFrame(tick); else g.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={ref} class="confetti" style={{ width: '100%', height: '100%' }} />;
}
