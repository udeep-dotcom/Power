// "Which vowel sign?" — hear a syllable (कि), see the consonant (क), and choose the sign that
// makes it. Distractors always include the confusable partner (ि vs ी, ु vs ू …), which is
// exactly the distinction Nepali children struggle with. Without a voice, the syllable is
// shown instead and the task becomes visual matching.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { level } from '../../lib/level';
import { Bi } from '../../components/Bi';
import { Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { Celebration, HabreSays, RoundDots, SpeakerButton, TopBar } from '../../components/UI';
import { LETTER_BY_ID } from '../../data/alphabet';
import { BK_CONSONANTS, MATRAS, MATRA_BY_ID, MATRA_CONFUSABLE, showSign, syllable, type Matra } from '../../data/barakhari';
import { UI } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { goBack } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { canSpeak, initSpeech, instruct, say } from '../../lib/speech';
import { awardSticker, completeNode, getState, learnedLetterIds } from '../../lib/store';
import { haptic, shuffle, sleep, starsFromMistakes } from '../../lib/util';

const ROUNDS = 8;

export function planMatraRounds(consonantIds: string[], rounds = ROUNDS, optionCount = 3) {
  const signs = MATRAS.filter((m) => m.sign);
  const targets = [...shuffle(signs), ...shuffle(signs)].slice(0, rounds);
  return targets.map((m, i) => {
    const c = LETTER_BY_ID[consonantIds[i % consonantIds.length]];
    const partner = MATRA_BY_ID[MATRA_CONFUSABLE[m.id]];
    const other = shuffle(signs.filter((x) => x.id !== m.id && x.id !== partner?.id))[0];
    // younger children: just the sign and its confusable partner
    return { c, m, options: shuffle([m, ...(partner ? [partner] : []), ...(optionCount > 2 || !partner ? [other] : [])]) };
  });
}

export function MatraGame() {
  const rounds = useMemo(() => {
    const learned = learnedLetterIds(getState()).filter((id) => LETTER_BY_ID[id].kind !== 'vowel');
    const pool = learned.length >= 3 ? learned : BK_CONSONANTS.slice(0, 8).map((l) => l.id);
    return planMatraRounds(shuffle(pool), ROUNDS, level().choices >= 3 ? 3 : 2);
  }, []);
  const [voiceOk, setVoiceOk] = useState(true);
  const [i, setI] = useState(0);
  const [marks, setMarks] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [built, setBuilt] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [sticker, setSticker] = useState(false);
  const mistakes = useRef(0);
  const locked = useRef(false);
  const r = rounds[i];

  useEffect(() => { void initSpeech().then(() => setVoiceOk(canSpeak())); }, []);
  const prompt = () => say(syllable(r.c, r.m), `syl-${r.c.id}-${r.m.id}`);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sleep(350);
      if (i === 0) await instruct(voiceOk ? UI.bkGameHow : UI.bkGameHowSilent);
      if (!cancelled && voiceOk) void prompt();
    })();
    return () => { cancelled = true; };
  }, [i, voiceOk]);

  const choose = async (m: Matra) => {
    if (locked.current) return;
    if (m.id === r.m.id) {
      locked.current = true;
      sfx.correct(); haptic('success');
      setMarks({ [m.id]: 'correct' });
      setBuilt(true);
      void prompt();
      await sleep(1200);
      setMarks({}); setBuilt(false); locked.current = false;
      if (i + 1 >= ROUNDS) {
        const stars = starsFromMistakes(mistakes.current);
        completeNode('B:game', stars);
        if (stars >= 2) setSticker(awardSticker('barakhari'));
        setResult(stars);
      } else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      mistakes.current++;
      setMarks((x) => ({ ...x, [m.id]: 'wrong' }));
      setTimeout(() => setMarks((x) => { const n = { ...x }; delete n[m.id]; return n; }), 600);
    }
  };

  return (
    <div class="screen game bk-game">
      <Scenery kind="pahad" />
      <TopBar title={<Bi t={UI.bkPlay} />} />
      <div class="game-body">
        <HabreSays text={voiceOk ? UI.bkGameHow : UI.bkGameHowSilent} size={68} speakOnMount={false} />
        <RoundDots total={ROUNDS} done={i} />
        <div class="prompt card bk-prompt" key={i} data-target={r.m.id}>
          {voiceOk && <SpeakerButton onClick={() => void prompt()} />}
          <span class={`bk-build deva ${built ? 'built' : ''}`} lang="ne">
            {built ? syllable(r.c, r.m) : <>{r.c.char}<span class="bk-slot">?</span></>}
          </span>
          {!voiceOk && !built && <span class="bk-target deva" lang="ne">→ {syllable(r.c, r.m)}</span>}
        </div>
        <div class={`choice-grid n${r.options.length}`}>
          {r.options.map((m) => (
            <button key={`${i}-${m.id}`} data-id={m.id} class={`tile choice ${marks[m.id] ?? ''}`} onClick={() => choose(m)} aria-label={m.name.en}>
              <span class="deva" lang="ne">{showSign(m)}</span>
            </button>
          ))}
        </div>
      </div>
      {result !== null && (
        <Celebration title={UI.bkDone} stars={result} onNext={() => goBack('/barakhari')}>
          {sticker && <div class="sticker"><Pic pic={STICKER_BY_ID.barakhari.pic} size={80} /></div>}
        </Celebration>
      )}
    </div>
  );
}
