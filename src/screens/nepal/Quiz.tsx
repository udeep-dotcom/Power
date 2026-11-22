// Nepal quiz: 8 picture-supported questions drawn from the pool, options shuffled.
// The question is read aloud, so non-readers can play.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { Celebration, HabreSays, RoundDots, TopBar } from '../../components/UI';
import { UI } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { QUIZ } from '../../data/nepal';
import { goBack } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { awardSticker, update, useStore } from '../../lib/store';
import { haptic, shuffle, sleep, starsFromMistakes, tr } from '../../lib/util';

const N = 8;

export function Quiz() {
  const s = useStore();
  const qs = useMemo(() => shuffle(QUIZ).slice(0, N).map((q) => {
    const order = shuffle(q.options.map((_, i) => i));
    return { q: q.q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  }), []);
  const [i, setI] = useState(0);
  const [marks, setMarks] = useState<Record<number, 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [firstTry, setFirstTry] = useState(true);
  const [done, setDone] = useState(false);
  const [newSticker, setNewSticker] = useState(false);
  const q = qs[i];

  useEffect(() => { setFirstTry(true); }, [i]);

  const choose = async (k: number) => {
    if (marks[k] || Object.values(marks).includes('correct')) return;
    if (k === q.answer) {
      sfx.correct(); haptic('success');
      setMarks({ [k]: 'correct' });
      const sc = score + (firstTry ? 1 : 0);
      setScore(sc);
      await sleep(1000);
      setMarks({});
      if (i + 1 >= N) {
        update((st) => { st.quizBest = Math.max(st.quizBest, sc); });
        if (sc >= 6) setNewSticker(awardSticker('quiz'));
        setDone(true);
      } else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      setFirstTry(false);
      setMistakes((m) => m + 1);
      setMarks((m) => ({ ...m, [k]: 'wrong' }));
    }
  };

  return (
    <div class="screen quiz-screen">
      <Scenery kind="home" />
      <TopBar title={tr(UI.quiz)} right={<span class="chip">★ {score}</span>} />
      <RoundDots total={N} done={i} />
      <HabreSays key={i} text={q.q} size={78} />
      <div class="quiz-options">
        {q.options.map((o, k) => (
          <button key={`${i}-${k}`} class={`tile quiz-opt ${marks[k] ?? ''} ${marks[k] === 'wrong' ? 'dim' : ''}`} onClick={() => choose(k)} style={{ animationDelay: `${k * 0.07}s` }}>
            <Pic pic={o.pic} size={58} />
            <span class={s.lang === 'ne' ? 'deva' : ''}>{tr(o.label)}</span>
          </button>
        ))}
      </div>
      {done && (
        <Celebration title={UI.quizDone} subtitle={{ ne: `${N} मध्ये ${score} सही!`, en: `${score} of ${N} right first time!` }} stars={starsFromMistakes(mistakes)}
          onNext={() => goBack('/nepal')}>
          {newSticker && <div class="sticker"><Pic pic={STICKER_BY_ID.quiz.pic} size={80} /><div class="deva">{tr(UI.newSticker)}</div></div>}
        </Celebration>
      )}
    </div>
  );
}
