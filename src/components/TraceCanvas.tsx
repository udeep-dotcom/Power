import { useEffect, useRef, useState } from 'preact/hooks';
import { UI } from '../data/i18n';
import { sfx } from '../lib/sfx';
import { maskFromCanvas, scoreTrace, type Mask, type TraceScore } from '../lib/trace';
import { haptic, tr } from '../lib/util';
import { Icon, Pic } from './Art';

const FONT = '"Noto Sans Devanagari"';

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

  // Size to the available width.
  useEffect(() => {
    const el = wrap.current!;
    const fit = () => setSize(Math.floor(Math.min(el.clientWidth, 400, window.innerHeight * 0.48)));
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
      g.fillStyle = '#f6ead8';
      g.fillText(char, x, y);
      g.lineWidth = 3; g.strokeStyle = '#d9c09b'; g.setLineDash([2, 7]); g.lineCap = 'round';
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
    const r = ink.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
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
    if (!letterMask.current || !shadow.current) return;
    const score = scoreTrace(letterMask.current, maskFromCanvas(shadow.current));
    if (score.stars === 3 || (final && score.stars > 0)) {
      sfx.correct(); haptic('success');
      onResult(score);
    } else if (final) {
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
  };
  const up = () => {
    if (!last.current) return;
    last.current = null;
    strokeCount.current++;
    evaluate(false);
  };

  const clear = () => {
    for (const c of [ink.current, shadow.current]) {
      const g = c?.getContext('2d');
      g?.save(); g?.setTransform(1, 0, 0, 1, 0, 0); g?.clearRect(0, 0, c!.width, c!.height); g?.restore();
    }
    setDrawn(false);
  };

  return (
    <div class="trace">
      <div class="trace-pad card" ref={wrap}>
        <div class="trace-stack" style={{ width: size, height: size }}>
          <canvas ref={guide} class="trace-guide" />
          <canvas ref={ink} class="trace-ink" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
          {hint && <span class="trace-hint"><Pic pic="👆" size={56} /></span>}
          {feedback === 'almost' && <span class="trace-feedback">{tr(UI.almost)}</span>}
        </div>
      </div>
      <div class="trace-actions">
        <button class="btn white" onClick={() => { sfx.tap(); clear(); }} disabled={!drawn}><Icon name="refresh" /> {tr(UI.clear)}</button>
        <button class="btn big" onClick={() => evaluate(true)} disabled={!drawn}><Icon name="check" /> {tr(UI.done)}</button>
      </div>
    </div>
  );
}
