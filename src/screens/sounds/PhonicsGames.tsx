// Listening games for pronunciation:
//  • कान खोलेर सुन (minimal pairs) — two words differing in ONE sound: बात/भात, दाल/डाल, fan/van…
//    After each answer Habre names the difference ("भ has a big puff of air 🕯️").
//  • Sound hunt (English) — hear a letter sound, find the picture that starts with it.
//  • ध्वनि साथी (sound friends) — English sounds and their Nepali "friends": m = म, t ≈ ट …
//    plus the sounds only one language has.

import { useMemo, useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Pic } from '../../components/Art';
import { PickGame, type PickRound } from '../../components/PickGame';
import { Scenery } from '../../components/Scenery';
import { Celebration, HabreSays, TopBar } from '../../components/UI';
import { LETTER_BY_ID } from '../../data/alphabet';
import { UI } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { EN_LETTERS, MINIMAL_PAIRS, ONLY_IN, type EnLetter } from '../../data/phonics';
import { level } from '../../lib/level';
import { goBack, navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { say, sayEnglish } from '../../lib/speech';
import { awardSticker, completeNode } from '../../lib/store';
import { shuffle, starsFromMistakes } from '../../lib/util';
import { sayEnSound } from './Abc';

function Done({ title, sticker, stars, back }: { title: typeof UI.gameDone; sticker: string | null; stars: number; back: string }) {
  return (
    <Celebration title={title} stars={stars} onNext={() => goBack(back)}>
      {sticker && <div class="sticker"><Pic pic={STICKER_BY_ID[sticker].pic} size={80} /></div>}
    </Celebration>
  );
}

export function PairsGame({ lang }: { lang: 'ne' | 'en' }) {
  const rounds = useMemo<PickRound[]>(() => {
    const pairs = MINIMAL_PAIRS.filter((p) => p.lang === lang);
    return shuffle(Array.from({ length: 6 }, (_, k) => {
      const p = pairs[k % pairs.length];
      const side = Math.random() < 0.5 ? 'a' : 'b';
      const target = p[side];
      // clip ids stay ASCII (mp-bat-bhat-b): Devanagari file names get mangled by some OS/export tools
      const speak = (slow?: boolean) => (lang === 'ne' ? say(target.word, `mp-${p.id}-${side}`, { slow }) : sayEnglish(target.word, `en-w-${target.word}`, { slow }));
      return {
        key: `${k}-${p.id}`, prompt: speak, answer: target.word, after: p.feature,
        options: shuffle([p.a, p.b]).map((x) => ({ id: x.word, pic: x.pic, label: x.word })),
      };
    }));
  }, []);
  const [done, setDone] = useState<{ stars: number; sticker: string | null } | null>(null);
  return (
    <div class="screen game pairs-screen">
      <Scenery kind={lang === 'ne' ? 'pahad' : 'home'} />
      <TopBar title={<Bi t={UI.pairs} />} />
      <PickGame rounds={rounds} howto={UI.pairsHow} onFinish={(m) => {
        const stars = starsFromMistakes(m);
        completeNode(`SP:${lang}`, stars);
        setDone({ stars, sticker: stars >= 2 && awardSticker('ears') ? 'ears' : null });
      }} />
      {done && <Done title={UI.gameDone} stars={done.stars} sticker={done.sticker} back={lang === 'ne' ? '/sounds' : '/abc'} />}
    </div>
  );
}

/** Sound-hunt rounds: the first-taught letters (groups 1–3; x is heard at the END of fox, so it
 *  can't be a "starts with" target), and never two options that start with the same sound (c/k). */
export function planHunt(choices: number, rounds = 6): { target: EnLetter; options: EnLetter[] }[] {
  const usable = EN_LETTERS.filter((l) => l.group <= 3 && l.pos !== 'end');
  return shuffle(usable).slice(0, rounds).map((target) => {
    const others: EnLetter[] = [];
    for (const o of shuffle(usable)) {
      if (others.length >= Math.max(1, choices - 1)) break;
      if (o.id !== target.id && [target, ...others].every((x) => x.soundSay !== o.soundSay)) others.push(o);
    }
    return { target, options: shuffle([target, ...others]) };
  });
}

export function SoundHunt() {
  const rounds = useMemo<PickRound[]>(() => planHunt(level().choices).map(({ target: t, options }, k) => ({
    key: `${k}-${t.id}`, prompt: (slow?: boolean) => sayEnSound(t, slow), answer: t.id,
    show: <span class="hunt-letter">{t.lower}</span>,
    options: options.map((o) => ({ id: o.id, pic: o.pic })),
  })), []);
  const [done, setDone] = useState<{ stars: number; sticker: string | null } | null>(null);
  return (
    <div class="screen game hunt-screen">
      <Scenery kind="home" />
      <TopBar title={<Bi t={UI.hunt} />} />
      <PickGame rounds={rounds} howto={UI.huntHow} onFinish={(m) => {
        const stars = starsFromMistakes(m);
        completeNode('SH:en', stars);
        setDone({ stars, sticker: null });
      }} />
      {done && <Done title={UI.gameDone} stars={done.stars} sticker={done.sticker} back="/abc" />}
    </div>
  );
}

/** English letters whose sound has a Nepali consonant friend (vowels are left out: they only roughly match). */
export const FRIENDS = EN_LETTERS.filter((l) => l.friend && LETTER_BY_ID[l.friend].kind !== 'vowel');

export function FriendsScreen() {
  return (
    <div class="screen scroll friends-screen">
      <Scenery kind="terai" />
      <TopBar title={<Bi t={UI.friends} />} />
      <HabreSays text={{ ne: 'धेरै अङ्ग्रेजी आवाजका नेपाली साथी छन्! छोएर सुन।', en: 'Many English sounds have a Nepali friend! Touch to hear.' }} size={70} />
      <div class="friends-grid">
        {FRIENDS.map((l, i) => {
          const f = LETTER_BY_ID[l.friend!];
          return (
            <button key={l.id} class={`friend-pair ${l.friendHow}`} style={{ animationDelay: `${i * 0.03}s` }}
              onClick={async () => { sfx.tap(); await sayEnSound(l); await say(f.say ?? f.char, `letter-${f.id}`); }}>
              <span class="fp-en">{l.lower}</span>
              <span class="fp-eq">{l.friendHow === 'same' ? '=' : '≈'}</span>
              <span class="fp-ne deva" lang="ne">{f.char}</span>
            </button>
          );
        })}
      </div>
      <p class="friends-legend"><b>=</b> <Bi t={UI.sameSound} inline /> · <b>≈</b> <Bi t={UI.closeSound} inline /></p>
      <div class="only-cards">
        {ONLY_IN.map((o) => (
          <div key={o.sounds} class={`only-card card ${o.lang}`}>
            <span class="only-tag"><Bi t={o.lang === 'en' ? UI.onlyEnglish : UI.onlyNepali} inline /></span>
            <span class={`only-sounds ${o.lang === 'ne' ? 'deva' : ''}`} lang={o.lang}>{o.sounds}</span>
            <Bi t={o.note} />
          </div>
        ))}
      </div>
      <button class="btn big crimson words-play" onClick={() => { sfx.whoosh(); navigate('/sounds/friends/game'); }}>🤝 <Bi t={UI.friends} inline /></button>
    </div>
  );
}

/** Friends-game rounds: one English letter per Nepali friend (c and k share क, v and w share व),
 *  and the wrong options are other Nepali friends — never the right one twice. */
export function planFriends(choices: number, rounds = 6): { letter: EnLetter; options: string[] }[] {
  const ids = [...new Set(FRIENDS.map((o) => o.friend!))];
  return shuffle(FRIENDS).filter((l, k, arr) => arr.findIndex((x) => x.friend === l.friend) === k).slice(0, rounds).map((letter) => ({
    letter, options: shuffle([letter.friend!, ...shuffle(ids.filter((x) => x !== letter.friend)).slice(0, Math.max(1, choices - 1))]),
  }));
}

export function FriendsGame() {
  const rounds = useMemo<PickRound[]>(() => {
    return planFriends(level().choices).map(({ letter: l, options }, k) => {
      const f = LETTER_BY_ID[l.friend!];
      return {
        key: `${k}-${l.id}`, prompt: (slow?: boolean) => sayEnSound(l, slow), answer: f.id,
        show: <span class="hunt-letter">{l.lower}</span>,
        after: { ne: `${l.lower} ${l.friendHow === 'same' ? '=' : '≈'} ${f.char}`, en: `${l.lower} ${l.friendHow === 'same' ? 'sounds like' : 'sounds close to'} ${f.char}` },
        options: options.map((id) => ({ id, pic: `txt:${LETTER_BY_ID[id].char}` })),
      };
    });
  }, []);
  const [done, setDone] = useState<{ stars: number; sticker: string | null } | null>(null);
  return (
    <div class="screen game friends-game">
      <Scenery kind="terai" />
      <TopBar title={<Bi t={UI.friends} />} />
      <PickGame rounds={rounds} howto={UI.friendsHow} onFinish={(m) => {
        const stars = starsFromMistakes(m);
        completeNode('SF', stars);
        setDone({ stars, sticker: awardSticker('friends') ? 'friends' : null });
      }} />
      {done && <Done title={UI.gameDone} stars={done.stars} sticker={done.sticker} back="/sounds/friends" />}
    </div>
  );
}

