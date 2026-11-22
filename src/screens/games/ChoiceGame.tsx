// "Listen & pick" and "Picture match": 6 quick rounds, 3–4 big choices.
// If no Nepali voice is available, "listen" silently becomes "picture" so a child is never
// asked to answer a sound they cannot hear.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { Pic } from '../../components/Art';
import { HabreSays, RoundDots, SpeakerButton } from '../../components/UI';
import { LETTER_BY_ID, type Letter } from '../../data/alphabet';
import { GAME_META } from '../../data/journey';
import { sfx } from '../../lib/sfx';
import { canSpeak, initSpeech, say } from '../../lib/speech';
import { recordAnswer } from '../../lib/store';
import { distractors, haptic, shuffle, sleep, withReview } from '../../lib/util';
import type { GameProps } from './GameScreen';

const ROUNDS = 6;

export function ChoiceGame({ letters, onFinish, mode: wanted }: GameProps & { mode: 'listen' | 'picture' }) {
  const [mode, setMode] = useState(wanted);
  useEffect(() => { if (wanted === 'listen') void initSpeech().then(() => { if (!canSpeak()) setMode('picture'); }); }, []);

  const rounds = useMemo(() => {
    const pool = withReview(letters, 3);
    const targets: Letter[] = [];
    let bag: string[] = [];
    while (targets.length < ROUNDS) {
      if (!bag.length) bag = shuffle(pool);
      const id = bag.pop()!;
      if (targets[targets.length - 1]?.id !== id) targets.push(LETTER_BY_ID[id]);
    }
    const n = letters.length >= 5 ? 4 : 3;
    return targets.map((t) => ({ target: t, options: shuffle([t, ...distractors(t, n - 1, pool)]) }));
  }, []);

  const [i, setI] = useState(0);
  const [marks, setMarks] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const r = rounds[i];

  const prompt = () => (mode === 'listen' ? say(r.target.say ?? r.target.char, `letter-${r.target.id}`) : say(r.target.word, `word-${r.target.id}`));
  useEffect(() => { const t = setTimeout(() => void prompt(), 500); return () => clearTimeout(t); }, [i, mode]);

  const choose = async (o: Letter) => {
    if (locked) return;
    if (o.id === r.target.id) {
      setLocked(true);
      sfx.correct(); haptic('success');
      recordAnswer(r.target.id, true);
      setMarks({ [o.id]: 'correct' });
      await sleep(850);
      setMarks({});
      setLocked(false);
      if (i + 1 >= ROUNDS) onFinish(mistakes);
      else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      recordAnswer(r.target.id, false);
      setMistakes((m) => m + 1);
      setMarks((m) => ({ ...m, [o.id]: 'wrong' }));
      setTimeout(() => setMarks((m) => { const n = { ...m }; delete n[o.id]; return n; }), 600);
    }
  };

  const hidden = r.target.word.replace(r.target.hl, '＿');
  return (
    <div class="game-body">
      <HabreSays text={GAME_META[mode].howto} size={72} speakOnMount={false} />
      <RoundDots total={ROUNDS} done={i} />
      <div class="prompt card" key={i}>
        {mode === 'listen' ? (
          <div class="listen-prompt">
            <SpeakerButton onClick={() => void prompt()} />
            <span class="listen-wave"><i /><i /><i /><i /><i /></span>
          </div>
        ) : (
          <button class="picture-prompt" onClick={() => void prompt()}>
            <Pic pic={r.target.pic} size={96} />
            <span class="word deva" lang="ne">{hidden.split('＿')[0]}<b class="blank">?</b>{hidden.split('＿')[1]}</span>
          </button>
        )}
      </div>
      <div class={`choice-grid n${r.options.length}`}>
        {r.options.map((o) => (
          <button key={`${i}-${o.id}`} class={`tile choice ${marks[o.id] ?? ''}`} onClick={() => choose(o)}>
            <span class="deva" lang="ne">{o.char}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
