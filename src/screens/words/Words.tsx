// शब्द — first words. Topic picker → word cards (tap to hear) → listening game.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Pic, Stars } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { Celebration, HabreSays, RoundDots, SpeakerButton, TopBar } from '../../components/UI';
import { UI, toNeDigits } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { TOPIC_BY_ID, WORD_TOPICS, type WordItem } from '../../data/words';
import { level } from '../../lib/level';
import { goBack, navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { canSpeak, initSpeech, instruct, say } from '../../lib/speech';
import { awardSticker, completeNode, markSeen, useStore } from '../../lib/store';
import { haptic, shuffle, sleep, starsFromMistakes, tileVars } from '../../lib/util';

export const speakWordItem = (w: WordItem) => say(w.ne, `w-${w.id}`);

export function WordsHub() {
  const s = useStore();
  return (
    <div class="screen scroll words-hub">
      <Scenery kind="terai" />
      <TopBar title={<Bi t={UI.words} />} />
      <HabreSays text={UI.wordsHello} size={78} />
      <div class="hub-grid">
        {WORD_TOPICS.map((t, i) => {
          const heard = t.words.filter((w) => s.wordsHeard.includes(w.id)).length;
          const stars = s.nodes[`W:${t.id}`] ?? 0;
          return (
            <button key={t.id} class="hub-tile" style={{ ...tileVars('tc', t.color), animationDelay: `${i * 0.05}s` } as never}
              onClick={() => { sfx.tap(); haptic(); navigate(`/words/${t.id}`); }}>
              <span class="hub-pic"><Pic pic={t.pic} size={60} /></span>
              <span class="hub-title"><Bi t={t.title} /></span>
              <span class="hub-progress">{stars ? <Stars n={stars} size={14} /> : `${toNeDigits(heard)}/${toNeDigits(t.words.length)}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WordTopicScreen({ topicId }: { topicId: string }) {
  const s = useStore();
  const t = TOPIC_BY_ID[topicId] ?? WORD_TOPICS[0];
  const [bounce, setBounce] = useState<string | null>(null);
  const hear = (w: WordItem) => {
    sfx.pop(); haptic();
    setBounce(w.id); setTimeout(() => setBounce(null), 500);
    markSeen('wordsHeard', w.id);
    void speakWordItem(w);
  };
  return (
    <div class="screen scroll word-topic">
      <Scenery kind="terai" />
      <TopBar title={<Bi t={t.title} />} />
      <div class="word-grid">
        {t.words.map((w, i) => (
          <button key={w.id} class={`word-tile ${bounce === w.id ? 'bounce' : ''} ${s.wordsHeard.includes(w.id) ? 'heard' : ''}`}
            style={{ ...tileVars('wc', t.color), animationDelay: `${i * 0.04}s` } as never} onClick={() => hear(w)}>
            <Pic pic={w.pic} size={66} />
            <span class="word-ne deva" lang="ne">{w.ne}</span>
            {(s.lang === 'en' || s.roman) && <span class="word-en">{s.roman ? w.roman : ''}{s.roman && s.lang === 'en' ? ' · ' : ''}{s.lang === 'en' ? w.en : ''}</span>}
          </button>
        ))}
      </div>
      <button class="btn big crimson words-play" onClick={() => { sfx.whoosh(); navigate(`/words/${t.id}/game`); }}>
        <Pic pic="👂" size={34} /> <Bi t={UI.listenGame} />
      </button>
    </div>
  );
}

const ROUNDS = 6;

export function WordGame({ topicId }: { topicId: string }) {
  const t = TOPIC_BY_ID[topicId] ?? WORD_TOPICS[0];
  const lv = useMemo(level, []);
  const rounds = useMemo(() => {
    const targets = [...shuffle(t.words), ...shuffle(t.words)].slice(0, ROUNDS);
    return targets.map((target) => ({
      target,
      options: shuffle([target, ...shuffle(t.words.filter((w) => w.id !== target.id && w.pic !== target.pic)).slice(0, lv.choices - 1)]),
    }));
  }, []);
  const [voiceOk, setVoiceOk] = useState(true);
  const [i, setI] = useState(0);
  const [marks, setMarks] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [result, setResult] = useState<number | null>(null);
  const [sticker, setSticker] = useState(false);
  const mistakes = useRef(0);
  const locked = useRef(false);
  const r = rounds[i];

  useEffect(() => { void initSpeech().then(() => setVoiceOk(canSpeak())); }, []);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sleep(300);
      if (i === 0) await instruct(UI.listenHow);
      if (!cancelled) void speakWordItem(r.target);
    })();
    return () => { cancelled = true; };
  }, [i]);

  const choose = async (w: WordItem) => {
    if (locked.current) return;
    if (w.id === r.target.id) {
      locked.current = true;
      sfx.correct(); haptic('success');
      markSeen('wordsHeard', w.id);
      setMarks({ [w.id]: 'correct' });
      void speakWordItem(w);
      await sleep(1100);
      setMarks({}); locked.current = false;
      if (i + 1 >= ROUNDS) {
        const stars = starsFromMistakes(mistakes.current);
        completeNode(`W:${t.id}`, stars);
        setSticker(awardSticker(`w-${t.id}`));
        setResult(stars);
      } else setI(i + 1);
    } else {
      sfx.wrong(); haptic('error');
      mistakes.current++;
      setMarks((m) => ({ ...m, [w.id]: 'wrong' }));
      setTimeout(() => setMarks((m) => { const n = { ...m }; delete n[w.id]; return n; }), 600);
    }
  };

  return (
    <div class="screen game word-game">
      <Scenery kind="terai" />
      <TopBar title={<Bi t={UI.listenGame} />} />
      <div class="game-body">
        <HabreSays text={UI.listenHow} size={68} speakOnMount={false} />
        <RoundDots total={ROUNDS} done={i} />
        <div class="prompt card" key={i} data-target={r.target.id}>
          {voiceOk ? (
            <div class="listen-prompt">
              <SpeakerButton onClick={() => void speakWordItem(r.target)} />
              <span class="listen-wave"><i /><i /><i /><i /><i /></span>
            </div>
          ) : (
            // Without a voice, a grown-up reads the word aloud (co-play suits this age anyway).
            <div class="read-prompt">
              <span class="deva word-ne" lang="ne">{r.target.ne}</span>
              <small><Bi t={UI.askGrownup} /></small>
            </div>
          )}
        </div>
        <div class={`choice-grid pics n${r.options.length}`}>
          {r.options.map((w) => (
            <button key={`${i}-${w.id}`} data-id={w.id} class={`tile choice pic-choice ${marks[w.id] ?? ''}`} onClick={() => choose(w)} aria-label={w.en}>
              <Pic pic={w.pic} size={84} />
              {marks[w.id] === 'correct' && <span class="deva pic-label" lang="ne">{w.ne}</span>}
            </button>
          ))}
        </div>
      </div>
      {result !== null && (
        <Celebration title={UI.gameDone} stars={result} onNext={() => goBack(`/words/${t.id}`)}>
          {sticker && <div class="sticker"><Pic pic={STICKER_BY_ID[`w-${t.id}`].pic} size={80} /></div>}
        </Celebration>
      )}
    </div>
  );
}
