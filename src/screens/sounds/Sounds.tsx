// ध्वनि (Nepali phonetics) hub + मुखको नक्सा (mouth map).
import { useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { GrownUp } from '../../components/GrownUp';
import { Pic } from '../../components/Art';
import { Echo } from '../../components/Echo';
import { Mouth } from '../../components/Mouth';
import { Scenery } from '../../components/Scenery';
import { HabreSays, TopBar } from '../../components/UI';
import { LETTER_BY_ID } from '../../data/alphabet';
import { UI, type T } from '../../data/i18n';
import { COLUMN_FEATURES, EXTRA_HOW, SAME_SOUND_NOTES, soundInfo, TEXTBOOK_PLACE, VARGAS } from '../../data/phonics';
import { navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { instruct, say } from '../../lib/speech';
import { awardSticker, getState, markSeen, useStore } from '../../lib/store';
import { haptic, tileVars } from '../../lib/util';

export const sayNeLetter = (id: string, slow = false) => {
  const l = LETTER_BY_ID[id];
  return say(l.say ?? l.char, `letter-${id}`, { slow });
};

export function HubTiles({ tiles }: { tiles: { path: string; pic: string; title: T; color: string; done?: boolean; locked?: boolean }[] }) {
  return (
    <div class="hub-grid">
      {tiles.map((t, i) => (
        <button key={t.path} class={`hub-tile ${t.locked ? 'locked' : ''}`} style={{ ...tileVars('tc', t.color), animationDelay: `${i * 0.05}s` } as never}
          onClick={() => { sfx.tap(); haptic(); navigate(t.path); }}>
          <span class="hub-pic"><Pic pic={t.pic} size={60} /></span>
          <span class="hub-title"><Bi t={t.title} /></span>
          {t.done && <span class="hub-progress">✓</span>}
          {t.locked && <span class="hub-lock" aria-label="needs recording">🎙️</span>}
        </button>
      ))}
    </div>
  );
}

export function SoundsHub() {
  const s = useStore();
  return (
    <div class="screen scroll sounds-hub">
      <Scenery kind="pahad" />
      <TopBar title={<Bi t={UI.sounds} />} />
      <HabreSays text={UI.soundsHello} size={78} />
      <HubTiles tiles={[
        { path: '/sounds/mouth', pic: '👄', title: UI.mouthMap, color: '#e8505b', done: s.stickers.includes('mouthmap') },
        { path: '/sounds/blend/ne', pic: '🧩', title: UI.blend, color: '#2fa36b', done: !!s.nodes['SB:ne'] },
        { path: '/sounds/pairs/ne', pic: '👂', title: UI.pairs, color: '#8e5bd6', done: !!s.nodes['SP:ne'] },
        { path: '/sounds/friends', pic: '🤝', title: UI.friends, color: '#1d4fb0', done: !!s.nodes['SF'] },
      ]} />
    </div>
  );
}

export function MouthMap({ initial }: { initial?: string }) {
  const [sel, setSel] = useState<string>(initial && soundInfo(initial) ? initial : 'ka');
  const [pulse, setPulse] = useState(0);
  const info = soundInfo(sel)!;
  const l = LETTER_BY_ID[sel];
  const varga = VARGAS.find((v) => v.id === info.place);

  const pick = (id: string) => {
    sfx.tap(); haptic();
    setSel(id); setPulse((n) => n + 1);
    void sayNeLetter(id);
    markSeen('soundsHeard', `ne:${id}`);
    const heard = new Set([...getState().soundsHeard, `ne:${id}`]);
    if (VARGAS.every((v) => v.letters.some((x) => heard.has(`ne:${x}`)))) awardSticker('mouthmap');
  };

  const feel = (t: T) => () => { sfx.tap(); void instruct(t); };

  return (
    <div class="screen scroll mouth-screen">
      <Scenery kind="pahad" />
      <TopBar title={<Bi t={UI.mouthMap} />} />
      <div class="mouth-card card">
        <div class="mouth-top">
          <Mouth place={info.place} air={info.air} buzz={info.buzz} nose={info.nose} pulse={pulse} size={200} />
          <div class="mouth-side">
            <button class="mouth-letter deva" lang="ne" key={pulse} onClick={() => pick(sel)}>{l.char}</button>
            <button class="btn white round slow-btn" aria-label="slow" onClick={() => { sfx.tap(); setPulse((n) => n + 1); void sayNeLetter(sel, true); }}><Pic pic="🐢" size={28} /></button>
            <Echo model={() => sayNeLetter(sel)} compact />
          </div>
        </div>
        {varga && <p class="mouth-place"><b><Bi t={varga.name} /></b></p>}
        <div class="feel-row">
          {info.air && <button class="feel on" onClick={feel(UI.feelAir)}>🕯️ <Bi t={UI.air} inline /></button>}
          {info.buzz && <button class="feel on" onClick={feel(UI.feelBuzz)}>🐝 <Bi t={UI.buzz} inline /></button>}
          {info.nose && <button class="feel on" onClick={feel(UI.feelNose)}>👃 <Bi t={UI.nose} inline /></button>}
        </div>
        {varga && (
          <GrownUp>
            <p class="mouth-how"><Bi t={EXTRA_HOW[sel] ?? varga.how} /></p>
            {TEXTBOOK_PLACE[sel] && <p class="mouth-book">📘 <Bi t={TEXTBOOK_PLACE[sel]} inline /></p>}
              </GrownUp>
        )}
      </div>

      <div class="varga-table card" role="grid">
        <div class="vt-row vt-head">
          <span class="vt-place" />
          {COLUMN_FEATURES.map((f, i) => (
            <span key={i} class="vt-feat" title={f.name.en}>{f.air ? '🕯️' : ''}{f.buzz ? '🐝' : ''}{f.nose ? '👃' : ''}{!f.air && !f.buzz ? '·' : ''}</span>
          ))}
        </div>
        {VARGAS.map((v) => (
          <div key={v.id} class={`vt-row ${info.place === v.id ? 'active' : ''}`} role="row">
            <span class="vt-place"><Bi t={{ ne: v.name.ne.split(' — ')[1] ?? v.name.ne, en: v.id }} /></span>
            {v.letters.map((id) => (
              <button key={id} class={`vt-cell deva ${id === sel ? 'sel' : ''}`} lang="ne" onClick={() => pick(id)} aria-label={LETTER_BY_ID[id].roman}>
                {LETTER_BY_ID[id].char}
              </button>
            ))}
          </div>
        ))}
        <div class="vt-extra">
          {['ya', 'ra', 'la', 'wa', 'sha', 'ssa', 'sa', 'ha'].map((id) => (
            <button key={id} class={`vt-cell deva ${id === sel ? 'sel' : ''}`} lang="ne" onClick={() => pick(id)}>{LETTER_BY_ID[id].char}</button>
          ))}
        </div>
        <p class="vt-note"><span class="deva" lang="ne">{SAME_SOUND_NOTES[0].letters}</span> — <Bi t={SAME_SOUND_NOTES[0].note} inline /></p>
      </div>
    </div>
  );
}
