// English ABC — letter SOUNDS first (synthetic phonics), names second.
import { useEffect } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Icon, Pic } from '../../components/Art';
import { Echo } from '../../components/Echo';
import { GrownUp } from '../../components/GrownUp';
import { Scenery } from '../../components/Scenery';
import { HabreSays, TopBar } from '../../components/UI';
import { LETTER_BY_ID } from '../../data/alphabet';
import { UI, toNeDigits } from '../../data/i18n';
import { EN_BY_ID, EN_GROUPS, EN_LETTERS, type EnLetter } from '../../data/phonics';
import { navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { hasClip, loadClips, say, sayEnglish } from '../../lib/speech';
import { PHONICS_NEEDS } from '../../data/clips';
import { useHasClips } from '../../components/RequireSounds';
import { awardSticker, getState, markSeen, useStore } from '../../lib/store';
import { haptic } from '../../lib/util';
import { HubTiles } from './Sounds';

export const sayEnName = (l: EnLetter) => sayEnglish(l.upper, `en-n-${l.id}`);
export const sayEnWord = (word: string, slow = false) => sayEnglish(word, `en-w-${word}`, { slow });
/** The letter's pure sound — only from a real recording. Text-to-speech says "tuh" for /t/ and
 *  "ah" for the a of apple, so without one we play the key word (correct audio) instead. */
export const sayEnSound = async (l: EnLetter, slow = false) => {
  await loadClips();
  return hasClip(`en-s-${l.id}`) ? sayEnglish(l.soundSay, `en-s-${l.id}`, { slow }) : sayEnWord(l.word, slow);
};
/** Sound then word ("s … sun"); just the word when the sound isn't recorded yet. */
export const sayEnSoundAndWord = async (l: EnLetter) => {
  await loadClips();
  if (hasClip(`en-s-${l.id}`)) await sayEnSound(l);
  return sayEnWord(l.word);
};

export function AbcHub() {
  const s = useStore();
  const hunt = useHasClips(PHONICS_NEEDS.hunt), blend = useHasClips(PHONICS_NEEDS.blendEn);
  return (
    <div class="screen scroll abc-hub">
      <Scenery kind="home" />
      <TopBar title={<Bi t={UI.abc} />} />
      <HabreSays text={UI.abcHello} size={74} />
      {EN_GROUPS.map((g) => (
        <section key={g} class="abc-group">
          <h2><Bi t={{ ne: `${UI.group.ne} ${toNeDigits(g)}`, en: `${UI.group.en} ${g}` }} inline /></h2>
          <div class="abc-grid">
            {EN_LETTERS.filter((l) => l.group === g).map((l, i) => (
              <button key={l.id} class={`abc-tile ${s.soundsHeard.includes(`en:${l.id}`) ? 'heard' : ''}`} style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => { sfx.tap(); haptic(); navigate(`/abc/${l.id}`); }} aria-label={l.upper}>
                <span class="abc-glyph">{l.upper}{l.lower}</span>
                <span class="abc-pic"><Pic pic={l.pic} size={26} /></span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <HubTiles tiles={[
        { path: '/abc/hunt', pic: '🔎', title: UI.hunt, color: '#ff9f1c', done: !!s.nodes['SH:en'], locked: hunt === false },
        { path: '/sounds/blend/en', pic: '🧩', title: UI.blend, color: '#2fa36b', done: !!s.nodes['SB:en'], locked: blend === false },
        { path: '/sounds/pairs/en', pic: '👂', title: UI.pairs, color: '#8e5bd6', done: !!s.nodes['SP:en'] },
        { path: '/sounds/friends', pic: '🤝', title: UI.friends, color: '#1d4fb0', done: !!s.nodes['SF'] },
      ]} />
    </div>
  );
}

function WordWithSound({ l }: { l: EnLetter }) {
  // highlight where the sound is: first letter, or the end for x (fox)
  const i = l.pos === 'end' ? l.word.lastIndexOf(l.id) : l.word.indexOf(l.id);
  return <span class="en-word">{l.word.slice(0, i)}<b>{l.word.slice(i, i + 1)}</b>{l.word.slice(i + 1)}</span>;
}

export function AbcLetter({ id }: { id: string }) {
  const l = EN_BY_ID[id] ?? EN_LETTERS[0];
  const idx = EN_LETTERS.indexOf(l);
  const prev = EN_LETTERS[idx - 1], next = EN_LETTERS[idx + 1];
  const friend = l.friend ? LETTER_BY_ID[l.friend] : null;

  useEffect(() => {
    markSeen('soundsHeard', `en:${l.id}`);
    const heard = new Set([...getState().soundsHeard, `en:${l.id}`]);
    if (EN_LETTERS.filter((x) => x.group === 1).every((x) => heard.has(`en:${x.id}`))) awardSticker('abc');
    const t = setTimeout(() => void sayEnSoundAndWord(l), 400);
    return () => clearTimeout(t);
  }, [l.id]);

  return (
    <div class="screen scroll abc-letter">
      <Scenery kind="home" />
      <TopBar title={<span class="abc-title">{l.upper} {l.lower}</span>} />
      <div class="abc-card card" key={l.id}>
        <button class="abc-big" onClick={() => { sfx.tap(); void sayEnSound(l); }}>{l.lower}</button>
        <div class="abc-buttons">
          <button class="btn sky" onClick={() => { sfx.tap(); void sayEnSound(l); }}><Icon name="speaker" /> <Bi t={UI.letterSound} /></button>
          <button class="btn white" onClick={() => { sfx.tap(); void sayEnName(l); }}><span class="abc-name">{l.upper}</span> <Bi t={UI.letterName} /></button>
          <button class="btn white round slow-btn" aria-label="slow" onClick={() => { sfx.tap(); void sayEnSound(l, true); }}><Pic pic="🐢" size={28} /></button>
        </div>
      </div>
      <button class="word-card card abc-word" onClick={() => { sfx.tap(); void sayEnWord(l.word); }}>
        <Pic pic={l.pic} size={80} />
        <WordWithSound l={l} />
      </button>
      <p class="abc-action card"><Bi t={l.action} /></p>
      <div class="abc-row">
        {friend && (
          <button class="friend-chip card" onClick={async () => { sfx.tap(); await sayEnSound(l); await say(friend.say ?? friend.char, `letter-${friend.id}`); }}>
            <span class="fc-en">{l.lower}</span>
            <span class="fc-eq">{l.friendHow === 'same' ? '=' : '≈'}</span>
            <span class="fc-ne deva" lang="ne">{friend.char}</span>
            <small><Bi t={l.friendHow === 'same' ? UI.sameSound : UI.closeSound} /></small>
          </button>
        )}
        <Echo model={() => sayEnSoundAndWord(l)} />
      </div>
      <GrownUp>
        <p class="abc-ipa">{l.ipa} · UK English</p>
        {!hasClip(`en-s-${l.id}`) && <p><Bi t={{ ne: 'यो अक्षरको शुद्ध ध्वनि अझै रेकर्ड भएको छैन, त्यसैले "आवाज" थिच्दा शब्द सुनिन्छ। अभिभावक क्षेत्र → आवाज स्टुडियो।', en: 'This letter\'s pure sound isn\'t recorded yet, so the sound button plays the key word. Parent zone → Voice Studio.' }} /></p>}
      </GrownUp>
      <div class="abc-nav">
        <button class="btn white round big-arrow" disabled={!prev} onClick={() => prev && navigate(`/abc/${prev.id}`, { replace: true })} aria-label="previous"><Icon name="back" /></button>
        <span class="abc-pos">{toNeDigits(idx + 1)}/{toNeDigits(EN_LETTERS.length)}</span>
        <button class="btn round big-arrow" disabled={!next} onClick={() => next && navigate(`/abc/${next.id}`, { replace: true })} aria-label="next"><Icon name="next" /></button>
      </div>
    </div>
  );
}
