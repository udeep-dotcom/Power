import { useEffect, useMemo, useState } from 'preact/hooks';
import { Icon, Pic } from '../components/Art';
import { Scenery } from '../components/Scenery';
import { TraceCanvas } from '../components/TraceCanvas';
import { Celebration, HabreSays, SpeakerButton, TopBar } from '../components/UI';
import { speakLetter, speakWord, Word } from '../components/Word';
import { LETTER_BY_ID, type Letter } from '../data/alphabet';
import { UI } from '../data/i18n';
import { goBack } from '../lib/router';
import { sfx } from '../lib/sfx';
import { completeNode, recordAnswer, update, useStore } from '../lib/store';
import { distractors, haptic, shuffle, sleep, tr } from '../lib/util';

type Step = 'learn' | 'trace' | 'find' | 'done';
const STEPS: Step[] = ['learn', 'trace', 'find'];

export function Lesson({ letterId }: { letterId: string; fromJourney?: boolean }) {
  const l = LETTER_BY_ID[letterId];
  const s = useStore();
  const [step, setStep] = useState<Step>('learn');
  const [traceStars, setTraceStars] = useState(0);
  const [flipIn, setFlipIn] = useState(0);

  useEffect(() => {
    if (!l) { goBack('/'); return; } // unknown letter id (old link) — leave quietly
    update((st) => { (st.letters[l.id] ??= { trace: 0, correct: 0, wrong: 0, seen: false }).seen = true; });
  }, [letterId]);

  if (!l) return null;

  const finishTrace = (stars: number) => {
    setTraceStars(stars);
    update((st) => { const p = st.letters[l.id]; p.trace = Math.max(p.trace, stars); });
    setTimeout(() => setStep('find'), 700);
  };

  return (
    <div class="screen lesson">
      <Scenery kind="pahad" />
      <TopBar
        title={<span class="steps">{STEPS.map((st, i) => <span key={st} class={`step-dot ${st === step ? 'cur' : STEPS.indexOf(step) > i || step === 'done' ? 'on' : ''}`} />)}</span>}
        right={<SpeakerButton onClick={() => { setFlipIn((n) => n + 1); void speakLetter(l); }} label={tr(UI.tapToHear)} />}
      />

      {step === 'learn' && (
        <div class="lesson-body">
          <button class="letter-card card" key={flipIn} onClick={() => { sfx.tap(); setFlipIn((n) => n + 1); void speakLetter(l); }}>
            <span class="big-letter deva" lang="ne">{l.char}</span>
            {s.roman && <span class="roman">{l.roman}</span>}
          </button>
          <button class="word-card card" onClick={() => { sfx.tap(); void speakWord(l); }}>
            <Pic pic={l.pic} size={92} />
            <span class="word-col">
              <Word l={l} size={44} />
              {(s.roman || s.lang === 'en') && <small>{l.wordRoman} · {l.meaning}</small>}
            </span>
          </button>
          <HabreSays size={64} speakOnMount={false} onReplay={() => void speakLetter(l)}
            text={{ ne: `${l.char} — ${l.word}को ${l.char}`, en: `${l.roman} — as in “${l.wordRoman}” (${l.meaning})` }} />
          <AutoSpeak l={l} />
          <button class="btn big crimson lesson-next" onClick={() => { sfx.whoosh(); setStep('trace'); }}>{tr(UI.traceStep)} <Icon name="next" /></button>
        </div>
      )}

      {step === 'trace' && (
        <div class="lesson-body">
          <HabreSays text={UI.traceHint} size={70} />
          <TraceCanvas char={l.char} onResult={(sc) => finishTrace(sc.stars)} />
        </div>
      )}

      {step === 'find' && <FindIt l={l} onDone={(firstTry) => {
        const stars = Math.max(1, Math.min(3, traceStars + (firstTry ? 0 : -1)));
        completeNode(`L:${l.id}`, stars);
        setTraceStars(stars);
        setStep('done');
      }} />}

      {step === 'done' && (
        <Celebration title={UI.lessonDone} stars={traceStars} onNext={() => goBack('/journey')}
          onAgain={() => { setStep('learn'); setFlipIn((n) => n + 1); }}>
          <div class="done-letter"><span class="deva" lang="ne">{l.char}</span><Pic pic={l.pic} size={56} /></div>
        </Celebration>
      )}
    </div>
  );
}

function AutoSpeak({ l }: { l: Letter }) {
  useEffect(() => { const t = setTimeout(() => void speakLetter(l), 450); return () => clearTimeout(t); }, [l.id]);
  return null;
}

function FindIt({ l, onDone }: { l: Letter; onDone: (firstTry: boolean) => void }) {
  const options = useMemo(() => shuffle([l, ...distractors(l, 3)]), [l.id]);
  const [state, setState] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [mistakes, setMistakes] = useState(0);
  const tap = async (o: Letter) => {
    if (state[l.id] === 'correct') return;
    if (o.id === l.id) {
      sfx.correct(); haptic('success');
      recordAnswer(l.id, true);
      setState((st) => ({ ...st, [o.id]: 'correct' }));
      void speakLetter(l);
      await sleep(900);
      onDone(mistakes === 0);
    } else {
      sfx.wrong(); haptic('error');
      recordAnswer(l.id, false);
      setMistakes((m) => m + 1);
      setState((st) => ({ ...st, [o.id]: 'wrong' }));
      setTimeout(() => setState((st) => { const n = { ...st }; delete n[o.id]; return n; }), 600);
    }
  };
  return (
    <div class="lesson-body">
      <HabreSays text={{ ne: `${l.char} कुन हो? छोऊ त!`, en: `Find the letter “${l.roman}”!` }} size={80} />
      <button class="find-target card" onClick={() => void speakLetter(l)}>
        <Pic pic={l.pic} size={64} /><Word l={l} size={34} />
      </button>
      <div class="choice-grid">
        {options.map((o) => (
          <button key={o.id} class={`tile choice ${state[o.id] ?? ''}`} onClick={() => tap(o)}>
            <span class="deva" lang="ne">{o.char}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
