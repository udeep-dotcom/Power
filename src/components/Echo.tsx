// मेरो आवाज — tap the mic: Habre says it, you say it, then you hear both, one after the other.
import { useEffect, useRef, useState } from 'preact/hooks';
import { UI } from '../data/i18n';
import { canRecord, playUrl, recordClip, releaseMic } from '../lib/recorder';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
import { Bi } from './Bi';
import { Pic } from './Art';

type Phase = 'idle' | 'listen' | 'record' | 'play' | 'error';

export function Echo({ model, compact = false }: { model: () => Promise<unknown>; compact?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const alive = useRef(true);

  useEffect(() => () => {
    alive.current = false;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    releaseMic();
  }, []);

  if (!canRecord()) return null;

  const go = async () => {
    if (phase !== 'idle' && phase !== 'error') return;
    try {
      setPhase('listen');
      await model();
      if (!alive.current) return;
      sfx.tap();
      setPhase('record');
      const u = await recordClip(2300, (v) => alive.current && setLevel(v));
      if (!alive.current) { URL.revokeObjectURL(u); return; }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = u; setUrl(u);
      setPhase('play');
      await playUrl(u);          // you
      await new Promise((r) => setTimeout(r, 250));
      await model();             // Habre again, to compare
      if (alive.current) setPhase('idle');
    } catch {
      if (alive.current) { setPhase('error'); void instruct(UI.micOff); }
    }
  };

  return (
    <div class={`echo ${compact ? 'compact' : ''} phase-${phase}`}>
      <button class="echo-mic" onClick={go} aria-label={UI.sayItToo.en} style={{ '--lvl': String(level) } as never}>
        <span class="echo-ring" />
        <Pic pic={phase === 'record' ? '🔴' : '🎤'} size={compact ? 28 : 36} />
      </button>
      {!compact && (
        <span class="echo-label">
          <Bi t={phase === 'record' ? UI.nowYou : phase === 'listen' ? UI.listenFirst : phase === 'error' ? UI.micOff : UI.sayItToo} />
        </span>
      )}
      {url && phase === 'idle' && (
        <button class="echo-replay" onClick={() => { sfx.tap(); void playUrl(url); }} aria-label={UI.myVoice.en}>
          <Pic pic="🧒" size={compact ? 22 : 28} />
        </button>
      )}
    </div>
  );
}
