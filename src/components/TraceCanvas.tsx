import { useEffect, useRef, useState } from 'preact/hooks';
import { UI } from '../data/i18n';
import { sfx } from '../lib/sfx';
import { maskFromCanvas, scoreTrace, type Mask, type TraceScore } from '../lib/trace';
import { haptic, tr } from '../lib/util';
import { toAppPx } from '../lib/scale';
import { Icon, Pic, Stars } from './Art';

const FONT = '"Noto Sans Devanagari"';
/** Guide fill — strong enough to see on a cheap, dim screen in daylight. (Tests read this colour.) */
export const GUIDE_FILL = '#f1dcc0';

/** Draw `char` centred in a square canvas using real glyph bounds (Devanagari metrics vary a lot). */
function drawGlyph(g: CanvasRenderingContext2D, char: string, size: number) {
  let fs = size * 0.72;
  g.font = `800 ${fs}px ${FONT}`;
  let m = g.measureText(char);
  const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const fit = Math.min((size * 0.78) / w, (size * 0.78) / h, 1.25);
  fs *= fit;
  g.font = `800 ${fs}px ${FONT}`;
  m = g.measureText(char);
  const x = size / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
  const y = size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  return { x, y };
}

export function TraceCanvas({ char, onResult }: { char: string; onResult: (s: TraceScore) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const guide = useRef<HTMLCanvasElement>(null);
  const ink = useRef<HTMLCanvasElement>(null);
  const letterMask = useRef<Mask | null>(null);
  const shadow = useRef<HTMLCanvasElement | null>(null); // unscaled copy of strokes for scoring
  const [size, setSize] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [hint, setHint] = useState(true);
  const [feedback, setFeedback] = useState<'' | 'almost'>('');
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokeCount = useRef(0);
  const [live, setLive] = useState(0);
  const accepted = useRef(false);
  const failures = useRef(0);
  const lastLive = useRef(0);
  const sparkles = useRef<HTMLDivElement>(null);

  // Size to the available width.
  useEffect(() => {
    const el = wrap.current!;
    const fit = () => setSize(Math.floor(Math.min(el.clientWidth - 24, 400, toAppPx(window.innerHeight) * 0.46)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw the guide letter once the font is ready, and build the letter mask.
  useEffect(() => {
    if (!size) return;
    let cancelled = false;
    (async () => {
      try { await document.fonts.load(`800 100px ${FONT}`, char); } catch { /* use fallback font */ }
      if (cancelled) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [guide.current!, ink.current!]) {
        c.width = c.height = size * dpr;
        c.style.width = c.style.height = `${size}px`;
        c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const g = guide.current!.getContext('2d')!;
      g.clearRect(0, 0, size, size);
      // dotted baseline grid like a Nepali writing copy (with the शिरोरेखा guide line)
      g.strokeStyle = '#f0e2cc'; g.lineWidth = 2; g.setLineDash([6, 8]);
      for (const f of [0.26, 0.74]) { g.beginPath(); g.moveTo(10, size * f); g.lineTo(size - 10, size * f); g.stroke(); }
      g.setLineDash([]);
      const { x, y } = drawGlyph(g, char, size);
      g.fillStyle = GUIDE_FILL;
      g.fillText(char, x, y);
      g.lineWidth = 3; g.strokeStyle = '#c29a63'; g.setLineDash([2, 7]); g.lineCap = 'round';
      g.strokeText(char, x, y);
      g.setLineDash([]);

      const m = document.createElement('canvas');
      m.width = m.height = size;
      const mg = m.getContext('2d')!;
      drawGlyph(mg, char, size);
      mg.fillStyle = '#000';
      mg.fillText(char, x, y);
      letterMask.current = maskFromCanvas(m, 100);

      const sh = document.createElement('canvas');
      sh.width = sh.height = size;
      shadow.current = sh;
    })();
    return () => { cancelled = true; };
  }, [size, char]);

  const lw = () => Math.max(14, size * 0.085);

  const pos = (e: PointerEvent) => {
    // Map viewport coordinates to canvas CSS pixels (correct under UI zoom and any transform).
    const r = ink.current!.getBoundingClientRect();
    const k = size / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
  };

  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    for (const [g, color] of [[ink.current!.getContext('2d')!, null], [shadow.current!.getContext('2d')!, '#000']] as const) {
      g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lw();
      if (color) g.strokeStyle = color;
      else {
        const grad = g.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, '#ff3b5c'); grad.addColorStop(1, '#c10f35');
        g.strokeStyle = grad;
        g.shadowColor = 'rgba(193,15,53,.35)'; g.shadowBlur = 6;
      }
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      g.shadowBlur = 0;
    }
  };

  const evaluate = (final: boolean) => {
    if (!letterMask.current || !shadow.current || accepted.current) return;
    const score = scoreTrace(letterMask.current, maskFromCanvas(shadow.current));
    (window as unknown as { __trace?: unknown }).__trace = score; // read by e2e tests
    if (score.stars > live) sfx.star(score.stars * 2);
    setLive(score.stars);
    if (score.stars === 3 || (final && score.stars > 0)) {
      accepted.current = true;
      sfx.correct(); haptic('success');
      onResult(score);
    } else if (final) {
      failures.current++;
      if (failures.current >= 3) {
        // Never a dead end: after three tries the child moves on with one star.
        accepted.current = true;
        sfx.correct();
        onResult({ ...score, stars: 1 });
        return;
      }
      sfx.wrong(); haptic('error');
      setFeedback('almost');
      setTimeout(() => { clear(); setFeedback(''); }, 1300);
    }
  };

  const down = (e: PointerEvent) => {
    if (!shadow.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setHint(false);
    last.current = pos(e);
    line(last.current, last.current);
    setDrawn(true);
  };
  const move = (e: PointerEvent) => {
    if (!last.current) return;
    const p = pos(e);
    if (Math.hypot(p.x - last.current.x, p.y - last.current.y) < 2) return;
    line(last.current, p);
    last.current = p;
    if (Math.random() < 0.08) sfx.stroke();
    sparkle(p.x, p.y);
    // live meter while drawing, throttled (scoring reads back a 64×64 canvas)
    const now = performance.now();
    if (now - lastLive.current > 180 && letterMask.current && shadow.current) {
      lastLive.current = now;
      const st = scoreTrace(letterMask.current, maskFromCanvas(shadow.current)).stars;
      if (st > live) { sfx.star(st * 2); setLive(st); }
    }
  };
  const up = () => {
    if (!last.current) return;
    last.current = null;
    strokeCount.current++;
    evaluate(false);
  };

  const sparkle = (x: number, y: number) => {
    const host = sparkles.current;
    if (!host || Math.random() > 0.35 || host.childElementCount > 14) return;
    const el = document.createElement('i');
    el.className = 'spark';
    el.style.left = `${x + (Math.random() - 0.5) * 24}px`;
    el.style.top = `${y + (Math.random() - 0.5) * 24}px`;
    el.style.background = ['#ffc21a', '#ff7aa8', '#6cc6ff', '#ffffff'][Math.floor(Math.random() * 4)];
    host.appendChild(el);
    setTimeout(() => el.remove(), 650);
  };

  const clear = () => {
    for (const c of [ink.current, shadow.current]) {
      const g = c?.getContext('2d');
      g?.save(); g?.setTransform(1, 0, 0, 1, 0, 0); g?.clearRect(0, 0, c!.width, c!.height); g?.restore();
    }
    setDrawn(false);
    setLive(0);
  };

  return (
    <div class="trace">
      <div class="trace-pad card" ref={wrap}>
        <div class="trace-stack" style={{ width: size, height: size }}>
          <canvas ref={guide} class="trace-guide" />
          <canvas ref={ink} class="trace-ink" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
          <div class="sparkles" ref={sparkles} />
          {hint && <span class="trace-hint"><Pic pic="👆" size={56} /></span>}
          {feedback === 'almost' && <span class="trace-feedback">{tr(UI.almost)}</span>}
        </div>
      </div>
      <div class={`trace-meter s${live}`} aria-label={`${live} / 3`}><Stars n={live} size={36} /></div>
      <div class="trace-actions">
        <button class="btn white" onClick={() => { sfx.tap(); clear(); }} disabled={!drawn}><Icon name="refresh" /> {tr(UI.clear)}</button>
        <button class={`btn big ${live > 0 ? 'pulse' : ''}`} onClick={() => evaluate(true)} disabled={!drawn}><Icon name="check" /> {tr(UI.done)}</button>
      </div>
    </div>
  );
}
