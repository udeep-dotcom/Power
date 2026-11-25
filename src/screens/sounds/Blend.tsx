// जोडेर पढौं — blending. Touch each sound button, then slide a finger along the arrow: the
// sounds light up in order and run together into the word, then the picture appears and the
// child picks it from 2–3 pictures (did you understand what you read?).
//
// Evidence-based progression (Reading Rockets): bigger chunks before single sounds. Ages 3–4
// blend onset + rime (c + at); ages 5–6 blend every sound (c-a-t). Nepali blends by syllable
// (अक्षर) because the script is syllabic — and the final अ drops when the word is said
// (क-म-ल → "kamal").

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { Celebration, HabreSays, RoundDots, TopBar } from '../../components/UI';
import { UI } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { BLEND_WORDS, EN_BY_ID, type BlendWord } from '../../data/phonics';
import { level } from '../../lib/level';
import { goBack } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { instruct, say, sayEnglish } from '../../lib/speech';
import { awardSticker, completeNode } from '../../lib/store';
import { haptic, shuffle, sleep, starsFromMistakes } from '../../lib/util';

const ROUNDS = 5;
/** Rimes that text-to-speech would otherwise spell out letter by letter. */
export const RIME_SAY: Record<string, string> = { ap: 'app', eb: 'ebb', ed: 'ed', ox: 'ox', og: 'ogg' };

function sayPart(w: BlendWord, part: string) {
  if (w.lang === 'ne') return say(part);
  if (part.length === 1 && EN_BY_ID[part]) return sayEnglish(EN_BY_ID[part].soundSay, `en-s-${part}`);
  return sayEnglish(RIME_SAY[part] ?? part, `en-r-${part}`);
}
const sayWhole = (w: BlendWord, slow = false) => (w.lang === 'ne' ? say(w.word, `w-blend-${w.id}`, { slow }) : sayEnglish(w.word, `en-w-${w.word}`, { slow }));

export function BlendGame({ lang }: { lang: 'ne' | 'en' }) {
  const lv = useMemo(level, []);
  const pool = BLEND_WORDS.filter((w) => w.lang === lang);
  const words = useMemo(() => shuffle(pool).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const [lit, setLit] = useState(-1);
  const [joined, setJoined] = useState(false);
  const [checking, setChecking] = useState(false);
  const [marks, setMarks] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [result, setResult] = useState<number | null>(null);
  const [sticker, setSticker] = useState(false);
  const mistakes = useRef(0);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const w = words[i];
  const parts = lv.age <= 4 ? w.chunks : w.phonemes;
  const options = useMemo(() => shuffle([w, ...shuffle(pool.filter((x) => x.id !== w.id && x.pic !== w.pic)).slice(0, Math.max(1, lv.choices - 1))]), [i]);

  useEffect(() => {
    setLit(-1); setJoined(false); setChecking(false);
    if (i === 0) void instruct(UI.blendHow);
  }, [i]);

  const finishBlend = async () => {
    if (joined) return;
    setJoined(true); setLit(parts.length);
    sfx.unlock(); haptic('success');
    await sleep(250);
    await sayWhole(w, true);
    await sayWhole(w);
    setChecking(true);
  };

  // Slide along the arrow: light + say each part as the finger passes it.
  const onMove = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const k = Math.min(parts.length - 1, Math.floor(p * parts.length));
    if (k > lit && !joined) { setLit(k); void sayPart(w, parts[k]); sfx.star(k); }
    if (p > 0.96) void finishBlend();
  };

  const autoBlend = async () => {
    for (let k = 0; k < parts.length; k++) { setLit(k); sfx.star(k); await sayPart(w, parts[k]); await sleep(120); }
    await finishBlend();
  };

  const choose = async (x: BlendWord) => {
    if (x.id === w.id) {
      sfx.correct(); haptic('success');
      setMarks({ [x.id]: 'correct' });
      await sleep(900);
      setMarks({});
      if (i + 1 >= words.length) {
        const stars = starsFromMistakes(mistakes.current);
        completeNode(`SB:${lang}`, stars);
        setSticker(awardSticker('blend'));
        setResult(stars);
      } else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      mistakes.current++;
      setMarks((m) => ({ ...m, [x.id]: 'wrong' }));
      setTimeout(() => setMarks((m) => { const n = { ...m }; delete n[x.id]; return n; }), 600);
      void sayWhole(w);
    }
  };

  return (
    <div class="screen game blend-screen">
      <Scenery kind={lang === 'ne' ? 'pahad' : 'home'} />
      <TopBar title={<Bi t={UI.blend} />} />
      <div class="game-body">
        <HabreSays text={UI.blendHow} size={60} speakOnMount={false} />
        <RoundDots total={words.length} done={i} />
        <div class={`blend-card card ${joined ? 'done' : ''}`} key={i} data-word={w.id}>
          <div class={`blend-parts ${joined ? 'joined' : ''} ${lang === 'ne' ? 'deva' : 'latin'}`} lang={lang}>
            {parts.map((p, k) => (
              <button key={k} class={`blend-part ${k <= lit ? 'lit' : ''}`} onClick={() => { sfx.tap(); setLit((x) => Math.max(x, k)); void sayPart(w, p); }}>
                <span class="bp-text">{p}</span>
                <span class="bp-dot" />
              </button>
            ))}
          </div>
          <div class="blend-track" ref={track}
            onPointerDown={(e) => { dragging.current = true; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); onMove(e.clientX); }}
            onPointerMove={(e) => dragging.current && onMove(e.clientX)}
            onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
            <span class="bt-line" />
            <span class="bt-head">➜</span>
            <span class="bt-thumb" style={{ left: `${joined ? 100 : ((lit + 1) / parts.length) * 100}%` }}>👆</span>
          </div>
          <button class="btn white blend-demo" onClick={() => { sfx.tap(); void autoBlend(); }}>▶ <Bi t={UI.listenFirst} inline /></button>
        </div>
        {checking && (
          <div class={`choice-grid pics n${options.length}`}>
            {options.map((x) => (
              <button key={`${i}-${x.id}`} data-id={x.id} class={`tile choice pic-choice ${marks[x.id] ?? ''}`} onClick={() => choose(x)} aria-label={x.en}>
                <Pic pic={x.pic} size={84} />
              </button>
            ))}
          </div>
        )}
      </div>
      {result !== null && (
        <Celebration title={UI.blendDone} stars={result} onNext={() => goBack(lang === 'ne' ? '/sounds' : '/abc')}>
          {sticker && <div class="sticker"><Pic pic={STICKER_BY_ID.blend.pic} size={80} /></div>}
        </Celebration>
      )}
    </div>
  );
}
