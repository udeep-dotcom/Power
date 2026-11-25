// Turns a raw phone recording into a clean clip: mono, silence trimmed (with a little air left
// at each end), loudness evened out so every clip plays at the same level, soft fades so there
// are no clicks, then encoded as 16-bit WAV. Pure functions are exported for unit tests.

export const CLIP_RATE = 24000;

/** RMS of each 10 ms window. */
function windowsRms(x: Float32Array, rate: number): Float32Array {
  const w = Math.max(1, Math.round(rate * 0.01));
  const out = new Float32Array(Math.ceil(x.length / w));
  for (let i = 0; i < out.length; i++) {
    let s = 0; const a = i * w, b = Math.min(x.length, a + w);
    for (let j = a; j < b; j++) s += x[j] * x[j];
    out[i] = Math.sqrt(s / Math.max(1, b - a));
  }
  return out;
}

export interface Cleaned { samples: Float32Array; tooQuiet: boolean; clipped: boolean; empty: boolean }

/** Trim silence, normalise to a steady level, fade the ends. */
export function cleanClip(x: Float32Array, rate: number): Cleaned {
  const rms = windowsRms(x, rate);
  let loud = 0;
  for (const v of rms) loud = Math.max(loud, v);
  // speech starts where a window is within 35 dB of the loudest window (and above the noise floor)
  const thr = Math.max(0.004, loud * 0.018);
  let first = -1, last = -1;
  for (let i = 0; i < rms.length; i++) if (rms[i] >= thr) { if (first < 0) first = i; last = i; }
  if (first < 0 || loud < 0.004) return { samples: new Float32Array(0), tooQuiet: true, clipped: false, empty: true };
  const w = Math.round(rate * 0.01);
  const a = Math.max(0, first * w - Math.round(rate * 0.08));
  const b = Math.min(x.length, (last + 1) * w + Math.round(rate * 0.15));
  const y = x.slice(a, b);
  let peak = 0;
  for (const v of y) peak = Math.max(peak, Math.abs(v));
  const clipped = peak >= 0.999;
  // level: aim the loudest 10 ms at -12 dBFS RMS, never past -1 dBFS peak, never more than ×12
  const gain = Math.min(0.25 / loud, 0.89 / peak, 12);
  for (let i = 0; i < y.length; i++) y[i] *= gain;
  const fi = Math.min(y.length, Math.round(rate * 0.008)), fo = Math.min(y.length, Math.round(rate * 0.03));
  for (let i = 0; i < fi; i++) y[i] *= i / fi;
  for (let i = 0; i < fo; i++) y[y.length - 1 - i] *= i / fo;
  return { samples: y, tooQuiet: loud < 0.02, clipped, empty: false };
}

export function encodeWav(x: Float32Array, rate: number): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(44 + x.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + x.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, x.length * 2, true);
  for (let i = 0; i < x.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i])) * 0x7fff, true);
  return new Uint8Array(buf);
}

/** Decode a MediaRecorder blob, mix to mono at CLIP_RATE, clean it, return a WAV blob. */
export async function processRecording(raw: Blob): Promise<{ wav: Blob; ms: number } & Omit<Cleaned, 'samples'>> {
  const data = await raw.arrayBuffer();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  let decoded: AudioBuffer;
  try { decoded = await ctx.decodeAudioData(data); } finally { void ctx.close(); }
  const len = Math.ceil(decoded.duration * CLIP_RATE);
  const off = new OfflineAudioContext(1, Math.max(1, len), CLIP_RATE);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const mono = (await off.startRendering()).getChannelData(0);
  const c = cleanClip(mono, CLIP_RATE);
  const wav = new Blob([encodeWav(c.samples, CLIP_RATE)], { type: 'audio/wav' });
  return { wav, ms: Math.round((c.samples.length / CLIP_RATE) * 1000), tooQuiet: c.tooQuiet, clipped: c.clipped, empty: c.empty };
}
