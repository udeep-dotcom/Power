// "Listen & pick", "Picture match" and the mixed "Today's practice": 6 quick rounds, 3–4 big
// choices. Habre explains the game aloud before the first prompt. If no Nepali voice is
// available, listening rounds silently become picture rounds, so a child is never asked to
// answer a sound they cannot hear.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Pic } from '../../components/Art';
import { HabreSays, RoundDots, SpeakerButton } from '../../components/UI';
import { BlankWord, speakLetterName, speakWord, Word } from '../../components/Word';
import { LETTER_BY_ID, type Letter } from '../../data/alphabet';
import { GAME_META } from '../../data/journey';
import { sfx } from '../../lib/sfx';
import { canSpeak, initSpeech, instruct } from '../../lib/speech';
import { recordAnswer } from '../../lib/store';
import { distractors, haptic, shuffle, sleep, withReview } from '../../lib/util';
import type { GameProps } from './GameScreen';

const ROUNDS = 6;
type Mode = 'listen' | 'picture';

/** Pick round targets: mostly the unit's own letters, plus a couple of weak earlier ones. */
export function planTargets(unitLetters: string[], reviewLetters: string[], rounds = ROUNDS): string[] {
  const nReview = Math.min(reviewLetters.length, Math.floor(rounds / 3));
  const bag = [...shuffle(unitLetters), ...shuffle(unitLetters)].slice(0, rounds - nReview);
  const out = shuffle([...bag, ...shuffle(reviewLetters).slice(0, nReview)]);
  // avoid the same letter twice in a row
  for (let i = 1; i < out.length; i++) {
    if (out[i] === out[i - 1]) {
      const j = out.findIndex((x, k) => k > i && x !== out[i]);
      if (j > 0) [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

export function ChoiceGame({ letters, onFinish, mode: wanted }: GameProps & { mode: Mode | 'mixed' }) {
  const [voiceOk, setVoiceOk] = useState(true);
  useEffect(() => { void initSpeech().then(() => setVoiceOk(canSpeak())); }, []);

  const rounds = useMemo(() => {
    const pool = withReview(letters, 3);
    const review = pool.filter((id) => !letters.includes(id));
    const ids = planTargets(letters, review);
    const n = letters.length >= 5 ? 4 : 3;
    return ids.map((id, k) => {
      const t = LETTER_BY_ID[id];
      const m: Mode = wanted === 'mixed' ? (k % 2 ? 'picture' : 'listen') : wanted;
      return { target: t, mode: m, options: shuffle([t, ...distractors(t, n - 1, pool)]) };
    });
  }, []);

  const [i, setI] = useState(0);
  const [marks, setMarks] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [revealed, setRevealed] = useState(false);
  const mistakes = useRef(0);
  const locked = useRef(false);
  const r = rounds[i];
  const mode: Mode = r.mode === 'listen' && !voiceOk ? 'picture' : r.mode;

  const prompt = () => (mode === 'listen' ? speakLetterName(r.target) : speakWord(r.target));
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sleep(350);
      if (i === 0 || rounds[i - 1].mode !== r.mode) await instruct(GAME_META[mode].howto);
      if (!cancelled) void prompt();
    })();
    return () => { cancelled = true; };
  }, [i, mode]);

  const choose = async (o: Letter) => {
    if (locked.current) return;
    if (o.id === r.target.id) {
      locked.current = true;
      sfx.correct(); haptic('success');
      recordAnswer(r.target.id, true);
      setMarks({ [o.id]: 'correct' });
      setRevealed(true);
      void speakWord(r.target);
      await sleep(1100);
      setMarks({});
      setRevealed(false);
      locked.current = false;
      if (i + 1 >= ROUNDS) onFinish(mistakes.current);
      else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      recordAnswer(r.target.id, false);
      mistakes.current++;
      setMarks((m) => ({ ...m, [o.id]: 'wrong' }));
      setTimeout(() => setMarks((m) => { const n = { ...m }; delete n[o.id]; return n; }), 600);
    }
  };

  return (
    <div class="game-body">
      <HabreSays text={GAME_META[mode].howto} size={72} speakOnMount={false} />
      <RoundDots total={ROUNDS} done={i} />
      <div class="prompt card" key={`${i}-${mode}`} data-target={r.target.id}>
        {mode === 'listen' && !revealed ? (
          <div class="listen-prompt">
            <SpeakerButton onClick={() => void prompt()} />
            <span class="listen-wave"><i /><i /><i /><i /><i /></span>
          </div>
        ) : (
          <button class="picture-prompt" onClick={() => void prompt()}>
            <Pic pic={r.target.pic} size={120} />
            {revealed ? <Word l={r.target} size={54} /> : <BlankWord l={r.target} size={54} />}
          </button>
        )}
      </div>
      <div class={`choice-grid n${r.options.length}`}>
        {r.options.map((o) => (
          <button key={`${i}-${o.id}`} data-id={o.id} class={`tile choice ${marks[o.id] ?? ''}`} onClick={() => choose(o)} aria-label={o.roman}>
            <span class="deva" lang="ne">{o.char}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
