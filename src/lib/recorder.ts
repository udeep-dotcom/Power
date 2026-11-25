// "Hear yourself" — on-device record & playback for pronunciation practice.
//
// Why not score pronunciation with speech recognition? Research on children's speech finds
// error rates around 40% on kids' read speech (vs <2% for adults) and ~58% for 3–5-year-olds,
// so automatic "right/wrong" judgements would often be unfair. Self-monitoring — hearing your
// own voice right next to the model — is reliable at any age. See docs/PHONICS_RESEARCH.md.
//
// Privacy: audio stays in memory on this device, is never uploaded or saved, and the
// microphone is switched off as soon as each 2-second clip ends (and when the child leaves).

import { getState } from './store';

let stream: MediaStream | null = null;

/** Embedded pages (an iframe without allow="microphone") can't record: hide the mic there
 *  instead of showing a button that can only fail. Browsers without the policy API just try. */
function micAllowedHere(): boolean {
  const pp = (document as Document & { permissionsPolicy?: { allowsFeature(f: string): boolean }; featurePolicy?: { allowsFeature(f: string): boolean } });
  const policy = pp.permissionsPolicy ?? pp.featurePolicy;
  try { return policy ? policy.allowsFeature('microphone') : true; } catch { return true; }
}

/** `grownUp`: the Voice Studio, which ignores the children's mic switch (a parent opened it). */
export function canRecord(grownUp = false): boolean {
  try {
    return (grownUp || getState().mic) && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined' && micAllowedHere();
  } catch { return false; }
}

/** Record for `ms` milliseconds. Calls onLevel(0..1) ~20×/s for a live meter. Returns an object URL. */
export async function recordClip(ms: number, onLevel?: (v: number) => void): Promise<string> {
  const r = await startRecording({ maxMs: ms, onLevel });
  return URL.createObjectURL(await r.done);
}

/** Start recording; resolves once the mic is live. `stop()` (or `maxMs`) ends it and yields the audio.
 *  The Voice Studio turns echo cancellation and auto-gain off (they pump and colour a voice); it keeps
 *  noise suppression, because most families record at home, not in a booth. */
export async function startRecording(o: { maxMs: number; onLevel?: (v: number) => void; studio?: boolean }): Promise<{ stop: () => void; done: Promise<Blob> }> {
  const { onLevel } = o;
  stream ??= await navigator.mediaDevices.getUserMedia({
    audio: o.studio ? { echoCancellation: false, noiseSuppression: true, autoGainControl: false } : { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  let ctx: AudioContext | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  if (onLevel) {
    try {
      ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      timer = setInterval(() => {
        an.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        onLevel(Math.min(1, peak / 64));
      }, 50);
    } catch { /* level meter is optional */ }
  }

  const stopped = new Promise<void>((r) => { rec.onstop = () => r(); });
  rec.start();
  let ended = false;
  const stop = () => { if (!ended) { ended = true; try { rec.stop(); } catch { /* already stopped */ } } };
  const cap = setTimeout(stop, o.maxMs);
  const done = stopped.then(() => {
    clearTimeout(cap);
    clearInterval(timer);
    void ctx?.close();
    onLevel?.(0);
    releaseMic(); // the mic is on only while the red dot shows — never between clips
    return new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
  });
  return { stop, done };
}

export async function playUrl(url: string): Promise<void> {
  const a = new Audio(url);
  const ended = new Promise((r) => { a.onended = r; a.onerror = r; });
  await a.play();
  // a clip whose length the browser can't read never fires "ended": cap the wait at 4 s
  await Promise.race([ended, new Promise((r) => setTimeout(r, 4000))]);
}

/** Turn the microphone off (the OS recording indicator disappears). */
export function releaseMic(): void {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}
