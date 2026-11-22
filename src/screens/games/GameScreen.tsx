import { useEffect, useMemo, useState } from 'preact/hooks';
import { Scenery } from '../../components/Scenery';
import { Celebration, TopBar } from '../../components/UI';
import { UI } from '../../data/i18n';
import { GAME_META, UNITS, type GameType } from '../../data/journey';
import { goBack } from '../../lib/router';
import { completeNode, getState, learnedLetterIds, letterProgress, mastery, today, update } from '../../lib/store';
import { shuffle, starsFromMistakes, tr } from '../../lib/util';
import { Balloon } from './Balloon';
import { ChoiceGame } from './ChoiceGame';
import { Memory } from './Memory';

export interface GameProps { letters: string[]; onFinish: (mistakes: number) => void }

const GAMES: Record<GameType, (p: GameProps) => preact.JSX.Element> = {
  listen: (p) => <ChoiceGame {...p} mode="listen" />,
  picture: (p) => <ChoiceGame {...p} mode="picture" />,
  balloon: (p) => <Balloon {...p} />,
  memory: (p) => <Memory {...p} />,
};

/** Hosts a unit's mini-game. */
export function GameScreen({ unitId }: { unitId: string }) {
  const unit = UNITS.find((u) => u.id === unitId) ?? UNITS[0];
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const meta = GAME_META[unit.game];
  const Game = GAMES[unit.game];

  return (
    <div class={`screen game game-${unit.game}`}>
      <Scenery kind={unit.region} />
      <TopBar title={tr(meta.name)} />
      <Game key={round} letters={unit.letters} onFinish={(m) => {
        const stars = starsFromMistakes(m);
        completeNode(`G:${unit.id}`, stars);
        setResult(stars);
      }} />
      {result !== null && (
        <Celebration title={UI.gameDone} stars={result} onNext={() => goBack('/journey')}
          onAgain={() => { setResult(null); setRound((r) => r + 1); }} />
      )}
    </div>
  );
}

/**
 * Today's practice — spaced review. Picks the 4 learned letters with the LOWEST mastery plus
 * 2 random learned ones (so it isn't always the same hard set), then plays a mixed
 * listen/picture round. Completing it is recorded for the parent report; there is no streak.
 */
export function pickPracticeLetters(): string[] {
  const s = getState();
  const learned = learnedLetterIds(s);
  const byWeakness = [...learned].sort((x, y) => mastery(letterProgress(s, x)) - mastery(letterProgress(s, y)));
  const weak = byWeakness.slice(0, 4);
  const extra = shuffle(byWeakness.slice(4)).slice(0, 2);
  return [...weak, ...extra];
}

export function PracticeScreen() {
  const letters = useMemo(pickPracticeLetters, []);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  useEffect(() => { if (letters.length < 2) goBack('/'); }, []); // reached without enough learned letters
  if (letters.length < 2) return null;
  return (
    <div class="screen game game-practice">
      <Scenery kind="home" />
      <TopBar title={tr(UI.todaysPractice)} />
      <ChoiceGame key={round} letters={letters} mode="mixed" onFinish={(m) => {
        const stars = starsFromMistakes(m);
        completeNode('P:practice', stars);
        update((s) => { if (!s.practiceDays.includes(today())) s.practiceDays.push(today()); });
        setResult(stars);
      }} />
      {result !== null && (
        <Celebration title={UI.practiceDone} stars={result} onNext={() => goBack('/')}
          onAgain={() => { setResult(null); setRound((r) => r + 1); }} />
      )}
    </div>
  );
}
