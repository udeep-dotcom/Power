// बाह्रखरी explorer: choose a consonant, tap any of its 12 forms, watch
// consonant + vowel sign = syllable assemble, and hear it.

import { useEffect, useRef, useState } from 'preact/hooks';
import { Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { HabreSays, TopBar } from '../../components/UI';
import { LETTER_BY_ID } from '../../data/alphabet';
import { BK_CONSONANTS, MATRAS, showSign, syllable, syllableRoman, type Matra } from '../../data/barakhari';
import { UI } from '../../data/i18n';
import { navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { say } from '../../lib/speech';
import { update, useStore } from '../../lib/store';
import { haptic, tr } from '../../lib/util';

export function Barakhari({ initial }: { initial?: string }) {
  const s = useStore();
  const [cId, setCId] = useState(initial && LETTER_BY_ID[initial]?.kind !== 'vowel' ? initial : 'ka');
  const [m, setM] = useState<Matra>(MATRAS[1]);
  const [pulse, setPulse] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const c = LETTER_BY_ID[cId];

  useEffect(() => {
    strip.current?.querySelector('.cchip.sel')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [cId]);

  const choose = (mm: Matra) => {
    sfx.pop(); haptic();
    setM(mm); setPulse((n) => n + 1);
    void say(syllable(c, mm), `syl-${c.id}-${mm.id}`);
    if (!s.barakhari.includes(c.id)) update((st) => { st.barakhari.push(c.id); });
  };

  return (
    <div class="screen scroll bk-screen">
      <Scenery kind="pahad" />
      <TopBar title={tr(UI.barakhari)} right={
        <button class="btn plum round" aria-label={tr(UI.bkPlay)} onClick={() => { sfx.tap(); navigate('/barakhari-game'); }}>
          <Pic pic="🎮" size={30} />
        </button>
      } />

      <div class="cstrip" ref={strip} role="listbox" aria-label="consonants">
        {BK_CONSONANTS.map((x) => (
          <button key={x.id} role="option" aria-selected={x.id === cId}
            class={`cchip ${x.id === cId ? 'sel' : ''} ${s.barakhari.includes(x.id) ? 'seen' : ''}`}
            onClick={() => { sfx.tap(); setCId(x.id); setPulse((n) => n + 1); void say(x.say ?? x.char, `letter-${x.id}`); }}>
            <span class="deva" lang="ne">{x.char}</span>
          </button>
        ))}
      </div>

      <div class="equation card" key={`${cId}-${pulse}`}>
        <span class="eq-part eq-c deva" lang="ne">{c.char}</span>
        <span class="eq-op">+</span>
        <span class="eq-part eq-m deva" lang="ne">{showSign(m)}</span>
        <span class="eq-op">=</span>
        <button class="eq-part eq-r deva" lang="ne" onClick={() => void say(syllable(c, m), `syl-${c.id}-${m.id}`)}>{syllable(c, m)}</button>
        {s.roman && <span class="eq-roman">{syllableRoman(c, m)}</span>}
      </div>
      <p class="eq-caption">{tr(m.name)}</p>

      <div class="bk-grid">
        {MATRAS.map((mm, i) => (
          <button key={mm.id} class={`tile bk-tile ${mm.id === m.id ? 'sel' : ''}`} style={{ animationDelay: `${i * 0.03}s` }} onClick={() => choose(mm)}>
            <span class="deva bk-syl" lang="ne">{syllable(c, mm)}</span>
            <span class="deva bk-sign" lang="ne">{showSign(mm)}</span>
          </button>
        ))}
      </div>

      <HabreSays text={UI.bkPick} size={60} />
    </div>
  );
}
