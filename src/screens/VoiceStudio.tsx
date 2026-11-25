// आवाज स्टुडियो · Voice Studio (inside the Parent zone, behind the grown-up gate).
//
// Why it exists: text-to-speech cannot make a premium children's app. Most devices have no Nepali
// voice (a Hindi voice reads the Nepali), and no TTS can make clean phonics sounds. Real voices
// fix both. A parent or grandparent records here, one line at a time; each clip is trimmed and
// levelled on the device and plays in the app straight away. Export sends them to whoever builds
// the app, so every family gets them (scripts/import-voices.mjs).

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Bi } from '../components/Bi';
import { CLIPS, CLIP_GROUPS, type Clip, type ClipGroup } from '../data/clips';
import { UI, type T } from '../data/i18n';
import { processRecording } from '../lib/audiotools';
import { canRecord, startRecording } from '../lib/recorder';
import { sfx } from '../lib/sfx';
import { playRecording, setLocalClip, stopSpeech } from '../lib/speech';
import { allLocal, clearLocal, deleteLocal, localIds, putLocal } from '../lib/voicebank';
import { makeZip } from '../lib/zip';
import { tr } from '../lib/util';

/** Long enough for a story page, short enough that a forgotten "stop" doesn't record a minute. */
const maxMs = (c: Clip) => Math.min(25000, Math.max(5000, c.text.length * 220));
/** Inside the Android app a browser-style download can't save a file (no Share/Filesystem plugin
 *  yet): recordings still play on that phone, and export happens from the web version. */
const inApp = () => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

export function VoiceStudio({ onClose }: { onClose: () => void }) {
  const [have, setHave] = useState<Set<string>>(new Set());
  const [group, setGroup] = useState<ClipGroup>('habre');
  const clips = useMemo(() => CLIPS.filter((c) => c.group === group), [group]);
  const [curId, setCurId] = useState<string>(clips[0].id);
  const [phase, setPhase] = useState<'idle' | 'rec' | 'proc'>('idle');
  const [level, setLevel] = useState(0);
  const [msg, setMsg] = useState<T | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const rec = useRef<{ stop: () => void } | null>(null);
  const mic = canRecord(true);
  const cur = clips.find((c) => c.id === curId) ?? clips[0];

  useEffect(() => { void localIds().then((ids) => setHave(new Set(ids))); return () => rec.current?.stop(); }, []);
  const firstTodo = (list: Clip[], h = have) => (list.find((c) => !h.has(c.id)) ?? list[0]).id;
  const pickGroup = (g: ClipGroup) => {
    const list = CLIPS.filter((c) => c.group === g);
    setGroup(g); setCurId(firstTodo(list)); setMsg(null);
  };

  const record = async () => {
    if (phase === 'rec') { rec.current?.stop(); return; }
    if (phase !== 'idle') return;
    setMsg(null); stopSpeech(); sfx.tap();
    const clip = cur;
    try {
      const r = await startRecording({ maxMs: maxMs(clip), onLevel: setLevel, studio: true });
      rec.current = r;
      setPhase('rec');
      const raw = await r.done;
      rec.current = null;
      setPhase('proc');
      const p = await processRecording(raw);
      if (p.empty) { setMsg(UI.nothingHeard); setPhase('idle'); return; }
      await putLocal({ id: clip.id, blob: p.wav, ms: p.ms, at: Date.now() });
      setLocalClip(clip.id, true);
      const next = new Set(have).add(clip.id);
      setHave(next);
      setMsg(p.clipped ? UI.tooLoud : p.tooQuiet ? UI.tooQuiet : null);
      setPhase('idle');
      await playRecording(clip.id); // hear it back at once
    } catch {
      rec.current = null;
      setMsg(UI.studioNoMic); setPhase('idle');
    }
  };

  const next = () => {
    sfx.tap();
    const i = clips.indexOf(cur);
    const after = [...clips.slice(i + 1), ...clips.slice(0, i + 1)];
    setCurId((after.find((c) => !have.has(c.id)) ?? after[0]).id);
    setMsg(null);
  };

  const remove = async () => {
    await deleteLocal(cur.id);
    setLocalClip(cur.id, false);
    const n = new Set(have); n.delete(cur.id); setHave(n);
  };

  const exportZip = async () => {
    const all = await allLocal();
    if (!all.length) return;
    const files = await Promise.all(all.map(async (c) => ({ name: `${c.id}.wav`, data: new Uint8Array(await c.blob.arrayBuffer()) })));
    const manifest = { app: 'akshar-yatra', made: new Date().toISOString(), clips: all.map((c) => c.id).sort() };
    files.push({ name: 'manifest.json', data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });
    const url = URL.createObjectURL(new Blob([makeZip(files)], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url; a.download = `akshar-yatra-voices-${manifest.made.slice(0, 10)}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const clearAll = async () => {
    const ids = await localIds();
    await clearLocal();
    ids.forEach((id) => setLocalClip(id, false));
    setHave(new Set()); setConfirmClear(false);
  };

  const groupInfo = CLIP_GROUPS.find((g) => g.id === group)!;
  const count = (g: ClipGroup) => CLIPS.filter((c) => c.group === g && have.has(c.id)).length;
  const total = (g: ClipGroup) => CLIPS.filter((c) => c.group === g).length;

  return (
    <div class="studio">
      <div class="studio-head">
        <button class="btn white" onClick={() => { rec.current?.stop(); stopSpeech(); onClose(); }}>← {tr(UI.parents)}</button>
        <h3>🎙️ {tr(UI.studio)}</h3>
      </div>
      <p class="studio-intro card">{tr(UI.studioIntro)}</p>
      {!mic && <p class="studio-warn card">{tr(UI.studioNoMic)}</p>}

      <div class="studio-tabs" role="tablist">
        {CLIP_GROUPS.map((g) => (
          <button key={g.id} role="tab" aria-selected={g.id === group} class={`studio-tab ${g.id === group ? 'on' : ''} ${count(g.id) === total(g.id) ? 'full' : ''}`} onClick={() => pickGroup(g.id)}>
            <span>{g.voice === 'en' ? '🇬🇧' : '🇳🇵'} {tr(g.title)}</span>
            <small>{count(g.id)}/{total(g.id)}</small>
          </button>
        ))}
      </div>

      <div class={`studio-card card phase-${phase}`} data-clip={cur.id}>
        <p class="studio-who">{groupInfo.voice === 'en' ? `🇬🇧 ${tr(UI.ukVoiceTip)}` : `🇳🇵 ${tr(UI.neVoiceTip)}`} · {clips.indexOf(cur) + 1}/{clips.length}{have.has(cur.id) ? ` · ✓ ${tr(UI.recorded)}` : ''}</p>
        <p class={`studio-text ${cur.voice === 'ne' ? 'deva' : ''}`} lang={cur.voice === 'ne' ? 'ne' : 'en'}>{cur.text}</p>
        <p class="studio-note">{cur.note}</p>
        <div class="studio-btns">
          <button class={`rec-btn ${phase}`} disabled={!mic || phase === 'proc'} onClick={record} style={{ '--lvl': String(level) } as never}
            aria-label={phase === 'rec' ? UI.stop.en : UI.record.en}>
            <span class="rec-dot" />
            <b>{tr(phase === 'rec' ? UI.stop : have.has(cur.id) ? UI.redo : UI.record)}</b>
          </button>
          {have.has(cur.id) && phase === 'idle' && (
            <>
              <button class="btn sky round" aria-label="play" onClick={() => void playRecording(cur.id)}>▶</button>
              <button class="btn white round" aria-label="delete" onClick={() => void remove()}>🗑</button>
            </>
          )}
          <button class="btn white" disabled={phase !== 'idle'} onClick={next}>{tr(UI.skip)} →</button>
        </div>
        {msg && <p class="studio-msg"><Bi t={msg} /></p>}
      </div>

      <div class="studio-list">
        {clips.map((c) => (
          <button key={c.id} class={`studio-row ${c.id === cur.id ? 'on' : ''} ${have.has(c.id) ? 'done' : ''}`} onClick={() => { if (phase === 'idle') { setCurId(c.id); setMsg(null); } }}>
            <span class="sr-mark">{have.has(c.id) ? '✓' : '○'}</span>
            <span class={`sr-text ${c.voice === 'ne' ? 'deva' : ''}`} lang={c.voice === 'ne' ? 'ne' : 'en'}>{c.text}</span>
          </button>
        ))}
      </div>

      <div class="studio-foot card">
        {inApp()
          ? <small class="pz-hint">{tr(UI.exportInApp)}</small>
          : <button class="btn sky" disabled={have.size === 0} onClick={() => void exportZip()}>⬇️ {tr(UI.exportZip)} ({have.size})</button>}
        <small class="pz-hint">{tr(UI.exportHint)}</small>
        {!confirmClear
          ? <button class="btn white" disabled={have.size === 0} onClick={() => setConfirmClear(true)}>{tr(UI.deleteAll)}</button>
          : <button class="btn crimson" onClick={() => void clearAll()}>✓ {tr(UI.deleteAll)}?</button>}
      </div>
    </div>
  );
}
