import { useState } from 'preact/hooks';
import { Scenery } from '../../components/Scenery';
import { Celebration, TopBar } from '../../components/UI';
import { UI } from '../../data/i18n';
import { GAME_META, UNITS, type GameType } from '../../data/journey';
import { goBack } from '../../lib/router';
import { completeNode } from '../../lib/store';
import { starsFromMistakes, tr } from '../../lib/util';
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

/** Hosts a unit's mini-game (also reachable from the Letters screen as /game/<unit>?type). */
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
