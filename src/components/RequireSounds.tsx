// Gate for the English phonics games. Text-to-speech says "tuh" for /t/ and "ah" for the a in
// "apple" — teaching that is worse than not teaching it. Until the pure sounds are recorded, the
// child sees Habre explain (in their language) and a grown-up sees how to unlock it in a minute.
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { UI } from '../data/i18n';
import { goBack, navigate } from '../lib/router';
import { hasClips, loadClips } from '../lib/speech';
import { tr } from '../lib/util';
import { Bi } from './Bi';
import { Scenery } from './Scenery';
import { HabreSays, TopBar } from './UI';

/** Re-renders whenever recordings are added or removed (Voice Studio) or first loaded. */
export function useClipsVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV((x) => x + 1);
    window.addEventListener('akshar:clips', h);
    void loadClips().then(h);
    return () => window.removeEventListener('akshar:clips', h);
  }, []);
  return v;
}

export function useHasClips(ids: string[]): boolean | null {
  const v = useClipsVersion();
  return v === 0 ? null : hasClips(ids);
}

export function RequireSounds({ ids, children, back }: { ids: string[]; children: ComponentChildren; back: string }) {
  const ok = useHasClips(ids);
  if (ok === null) return <div class="screen" />;
  if (ok) return <>{children}</>;
  return (
    <div class="screen needs-voice">
      <Scenery kind="home" />
      <TopBar title={<span>🎙️</span>} />
      <div class="game-body">
        <HabreSays text={UI.needsVoice} size={96} mood="think" />
        <div class="card needs-card">
          <p class="needs-mic">🎙️</p>
          <p><b>{tr(UI.grownUps)}:</b> {tr(UI.needsVoiceGrown)}</p>
          <button class="btn crimson" onClick={() => navigate('/parents')}>🎙️ {tr(UI.studio)}</button>
        </div>
        <button class="btn white" onClick={() => goBack(back)}>← <Bi t={UI.back} inline /></button>
      </div>
    </div>
  );
}
