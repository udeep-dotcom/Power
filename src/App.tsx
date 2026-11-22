import { useEffect } from 'preact/hooks';
import { useRoute } from './lib/router';
import { stopSpeech } from './lib/speech';
import { Home } from './screens/Home';
import { Journey } from './screens/Journey';
import { LetterGrid } from './screens/LetterGrid';
import { Lesson } from './screens/Lesson';
import { GameScreen } from './screens/games/GameScreen';
import { Chest } from './screens/Chest';
import { NepalHub } from './screens/nepal/NepalHub';
import { MapScreen } from './screens/nepal/MapScreen';
import { DeckScreen } from './screens/nepal/DeckScreen';
import { Quiz } from './screens/nepal/Quiz';
import { StickerBook } from './screens/StickerBook';
import { ParentZone } from './screens/ParentZone';

/*
 Routes
   /                      home
   /journey               the Terai → Himal path
   /letters               all 49 letters (free exploration)
   /learn/:letterId[/j]   letter lesson (j = launched from the journey, so completing it counts)
   /game/:unitId          the unit's mini-game
   /chest/:unitId         sticker reward
   /nepal, /nepal/map, /nepal/deck/:id, /nepal/quiz
   /stickers, /parents
*/
export function App() {
  const { parts, path } = useRoute();
  useEffect(() => () => stopSpeech(), [path]);
  const [a, b, c] = parts;

  let screen;
  if (!a) screen = <Home />;
  else if (a === 'journey') screen = <Journey />;
  else if (a === 'letters') screen = <LetterGrid />;
  else if (a === 'learn' && b) screen = <Lesson key={path} letterId={b} fromJourney={c === 'j'} />;
  else if (a === 'game' && b) screen = <GameScreen key={path} unitId={b} />;
  else if (a === 'chest' && b) screen = <Chest key={path} unitId={b} />;
  else if (a === 'nepal' && b === 'map') screen = <MapScreen />;
  else if (a === 'nepal' && b === 'deck' && c) screen = <DeckScreen key={path} deckId={c} />;
  else if (a === 'nepal' && b === 'quiz') screen = <Quiz key={path} />;
  else if (a === 'nepal') screen = <NepalHub />;
  else if (a === 'stickers') screen = <StickerBook />;
  else if (a === 'parents') screen = <ParentZone />;
  else screen = <Home />;

  return <div class="app-root" key={a ?? 'home'}>{screen}</div>;
}
