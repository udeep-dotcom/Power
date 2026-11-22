// अङ्क — numbers १–१०. Learn: tap a numeral and watch that many things appear while Habre
// counts aloud. Game: "कति वटा स्याउ छन्?" — tap each object to count it (each tap says the
// next number), then pick the numeral. Range grows with age (1–3 at 3, up to 1–10 at 6).

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { Celebration, HabreSays, RoundDots, TopBar } from '../../components/UI';
import { UI } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { COUNTABLES, NUMBERS } from '../../data/numbers';
import { level } from '../../lib/level';
import { goBack, navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { instruct, say, stopSpeech } from '../../lib/speech';
import { awardSticker, completeNode, useStore } from '../../lib/store';
import { haptic, pick, shuffle, sleep, starsFromMistakes } from '../../lib/util';

const sayNumber = (n: number) => say(NUMBERS[n - 1].ne, `n-${n}`);

export function NumbersScreen() {
  const s = useStore();
  const [shown, setShown] = useState<{ n: number; k: number; pic: string } | null>(null);
  const run = useRef(0);

  const countAlong = async (n: number) => {
    const my = ++run.current;
    stopSpeech();
    sfx.pop(); haptic();
    const pic = pick(COUNTABLES).pic;
    for (let k = 1; k <= n; k++) {
      if (run.current !== my) return;
      setShown({ n, k, pic });
      sfx.star(k);
      await sayNumber(k);
      await sleep(120);
    }
  };
  useEffect(() => () => { run.current++; }, []);

  return (
    <div class="screen scroll numbers-screen">
      <Scenery kind="home" />
      <TopBar title={<Bi t={UI.numbers} />} />
      <div class="count-stage card" aria-live="polite">
        {shown ? (
          <>
            <div class="count-items" key={shown.n}>
              {Array.from({ length: shown.k }, (_, i) => <span key={i} class="count-item"><Pic pic={shown.pic} size={shown.n > 6 ? 40 : 52} /></span>)}
            </div>
            <div class="count-big"><span class="deva" lang="ne">{NUMBERS[shown.k - 1].digit}</span><span class="deva count-word" lang="ne">{NUMBERS[shown.k - 1].ne}</span></div>
          </>
        ) : <HabreSays text={UI.numbersHello} size={70} />}
      </div>
      <div class="num-grid">
        {NUMBERS.map((x, i) => (
          <button key={x.n} class="num-tile" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => void countAlong(x.n)}>
            <span class="deva num-digit" lang="ne">{x.digit}</span>
            <span class="deva num-word" lang="ne">{x.ne}</span>
            {s.roman && <span class="num-roman">{x.roman}</span>}
          </button>
        ))}
      </div>
      <button class="btn big crimson words-play" onClick={() => { sfx.whoosh(); navigate('/numbers/game'); }}>
        <Pic pic="🍎" size={32} /> <Bi t={UI.countGame} />
      </button>
    </div>
  );
}

const ROUNDS = 6;

export function CountGame() {
  const lv = useMemo(level, []);
  const rounds = useMemo(() => {
    const out: { n: number; thing: typeof COUNTABLES[number]; options: number[] }[] = [];
    let prev = 0;
    for (let r = 0; r < ROUNDS; r++) {
      let n = 1 + Math.floor(Math.random() * lv.countMax);
      if (n === prev) n = (n % lv.countMax) + 1;
      prev = n;
      const others = shuffle(Array.from({ length: lv.countMax }, (_, i) => i + 1).filter((x) => x !== n)).slice(0, Math.min(lv.choices, lv.countMax) - 1);
      out.push({ n, thing: pick(COUNTABLES), options: shuffle([n, ...others]) });
    }
    return out;
  }, []);
  const [i, setI] = useState(0);
  const [counted, setCounted] = useState<number[]>([]);
  const [marks, setMarks] = useState<Record<number, 'correct' | 'wrong'>>({});
  const [result, setResult] = useState<number | null>(null);
  const [sticker, setSticker] = useState(false);
  const mistakes = useRef(0);
  const locked = useRef(false);
  const r = rounds[i];
  const question = { ne: `कति वटा ${r.thing.ne} छन्?`, en: `How many ${r.thing.en}?` };

  useEffect(() => {
    setCounted([]);
    const t = setTimeout(() => void instruct(i === 0 ? { ne: `${question.ne} छोएर गन त!`, en: `${question.en} Touch each one to count!` } : question), 350);
    return () => clearTimeout(t);
  }, [i]);

  const tapThing = (k: number) => {
    if (counted.includes(k) || locked.current) return;
    const next = [...counted, k];
    setCounted(next);
    sfx.pop(); haptic();
    void sayNumber(next.length);
  };

  const choose = async (n: number) => {
    if (locked.current) return;
    if (n === r.n) {
      locked.current = true;
      sfx.correct(); haptic('success');
      setMarks({ [n]: 'correct' });
      setCounted(Array.from({ length: r.n }, (_, k) => k));
      await say(`${NUMBERS[n - 1].ne} वटा ${r.thing.ne}!`);
      await sleep(400);
      setMarks({}); locked.current = false;
      if (i + 1 >= ROUNDS) {
        const stars = starsFromMistakes(mistakes.current);
        completeNode('N:count', stars);
        setSticker(awardSticker('counting'));
        setResult(stars);
      } else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      mistakes.current++;
      setMarks((m) => ({ ...m, [n]: 'wrong' }));
      setTimeout(() => setMarks((m) => { const x = { ...m }; delete x[n]; return x; }), 600);
    }
  };

  return (
    <div class="screen game count-game">
      <Scenery kind="home" />
      <TopBar title={<Bi t={UI.countGame} />} />
      <div class="game-body">
        <HabreSays text={question} size={64} speakOnMount={false} />
        <RoundDots total={ROUNDS} done={i} />
        <div class="count-field card" key={i} data-target={r.n}>
          {Array.from({ length: r.n }, (_, k) => (
            <button key={k} class={`count-thing ${counted.includes(k) ? 'counted' : ''}`} onClick={() => tapThing(k)} aria-label={`${k + 1}`}>
              <Pic pic={r.thing.pic} size={r.n > 6 ? 46 : 58} />
              {counted.includes(k) && <span class="count-badge deva" lang="ne">{NUMBERS[counted.indexOf(k)].digit}</span>}
            </button>
          ))}
        </div>
        <div class={`choice-grid n${r.options.length}`}>
          {r.options.map((n) => (
            <button key={`${i}-${n}`} data-id={n} class={`tile choice num-choice ${marks[n] ?? ''}`} onClick={() => choose(n)} aria-label={`${n}`}>
              <span class="deva" lang="ne">{NUMBERS[n - 1].digit}</span>
            </button>
          ))}
        </div>
      </div>
      {result !== null && (
        <Celebration title={UI.gameDone} stars={result} onNext={() => goBack('/numbers')}>
          {sticker && <div class="sticker"><Pic pic={STICKER_BY_ID.counting.pic} size={80} /></div>}
        </Celebration>
      )}
    </div>
  );
}
