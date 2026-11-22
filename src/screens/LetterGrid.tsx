// All 49 letters at a glance — free exploration. Tapping a tile says the letter; the
// "learn" corner opens the full lesson. Mastery shows as a coloured ring.

import { Pic, Stars } from '../components/Art';
import { Bi } from '../components/Bi';
import { Scenery } from '../components/Scenery';
import { TopBar } from '../components/UI';
import { LETTERS, type Letter } from '../data/alphabet';
import { UI } from '../data/i18n';
import { navigate } from '../lib/router';
import { sfx } from '../lib/sfx';
import { letterProgress, useStore } from '../lib/store';
import { haptic } from '../lib/util';

export function LetterGrid() {
  const s = useStore();
  const tile = (l: Letter) => {
    const p = letterProgress(s, l.id);
    const stars = s.nodes[`L:${l.id}`] ?? 0;
    return (
      <button key={l.id} class={`ltile ${l.kind} ${stars ? 'learned' : ''}`}
        onClick={() => { sfx.tap(); haptic(); navigate(`/learn/${l.id}`); }}>
        <span class="deva lt-char" lang="ne">{l.char}</span>
        {s.roman && <span class="lt-roman">{l.roman}</span>}
        <span class="lt-pic"><Pic pic={l.pic} size={24} /></span>
        {stars > 0 ? <span class="lt-stars"><Stars n={stars} size={12} /></span> : p.seen ? <span class="lt-dot" /> : null}
      </button>
    );
  };
  return (
    <div class="screen scroll letters-screen">
      <Scenery kind="terai" />
      <TopBar title={<Bi t={UI.letters} />} />
      <button class="bk-banner" onClick={() => { sfx.tap(); haptic(); navigate('/barakhari'); }}>
        <span class="deva bk-banner-ex" lang="ne">क का कि की</span>
        <span class="bk-banner-label"><Bi t={UI.barakhari} /><small><Bi t={UI.barakhariAge} inline /></small></span>
      </button>
      <section class="lgroup">
        <h2><span class="deva" lang="ne">स्वर वर्ण</span>{s.lang === 'en' && <small> · {UI.vowels.en}</small>}</h2>
        <div class="lgrid">{LETTERS.filter((l) => l.kind === 'vowel').map(tile)}</div>
      </section>
      <section class="lgroup">
        <h2><span class="deva" lang="ne">व्यञ्जन वर्ण</span>{s.lang === 'en' && <small> · {UI.consonants.en}</small>}</h2>
        <div class="lgrid">{LETTERS.filter((l) => l.kind !== 'vowel').map(tile)}</div>
      </section>
    </div>
  );
}
