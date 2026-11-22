import { useEffect, useState } from 'preact/hooks';
import { navigate, useRoute } from './lib/router';
import { stopSpeech } from './lib/speech';
import { Start } from './screens/Start';
import { Home } from './screens/Home';
import { Journey } from './screens/Journey';
import { LetterGrid } from './screens/LetterGrid';
import { Lesson } from './screens/Lesson';
import { GameScreen, PracticeScreen } from './screens/games/GameScreen';
import { Chest } from './screens/Chest';
import { NepalHub } from './screens/nepal/NepalHub';
import { MapScreen } from './screens/nepal/MapScreen';
import { DeckScreen } from './screens/nepal/DeckScreen';
import { Quiz } from './screens/nepal/Quiz';
import { StickerBook } from './screens/StickerBook';
import { ParentZone } from './screens/ParentZone';
import { Barakhari } from './screens/barakhari/Barakhari';
import { MatraGame } from './screens/barakhari/MatraGame';

/*
 Routes
   /                      home
   /journey               the Terai → Himal path
   /letters               all 49 letters (free exploration)
   /learn/:letterId[/j]   letter lesson
   /game/:unitId          the unit's mini-game
   /practice              today's practice (spaced review of weakest letters)
   /chest/:unitId         sticker reward
   /barakhari[/:id]       बाह्रखरी explorer (optionally opened on a consonant)
   /barakhari-game        build-the-syllable game
   /nepal, /nepal/map, /nepal/deck/:id, /nepal/quiz
   /stickers, /parents
*/
export function App() {
  const { parts, path } = useRoute();
  // The start screen shows once per app session (it unlocks audio and picks the player).
  const [started, setStarted] = useState(false);
  useEffect(() => () => stopSpeech(), [path]);
  const [a, b, c] = parts;

  if (!started) return <div class="app-root"><Start onStart={() => setStarted(true)} /></div>;

  let screen;
  if (!a) screen = <Home onSwitchPlayer={() => { navigate('/', { replace: true }); setStarted(false); }} />;
  else if (a === 'journey') screen = <Journey />;
  else if (a === 'letters') screen = <LetterGrid />;
  else if (a === 'learn' && b) screen = <Lesson key={path} letterId={b} fromJourney={c === 'j'} />;
  else if (a === 'game' && b) screen = <GameScreen key={path} unitId={b} />;
  else if (a === 'practice') screen = <PracticeScreen key={path} />;
  else if (a === 'chest' && b) screen = <Chest key={path} unitId={b} />;
  else if (a === 'barakhari') screen = <Barakhari key={path} initial={b} />;
  else if (a === 'barakhari-game') screen = <MatraGame key={path} />;
  else if (a === 'nepal' && b === 'map') screen = <MapScreen />;
  else if (a === 'nepal' && b === 'deck' && c) screen = <DeckScreen key={path} deckId={c} />;
  else if (a === 'nepal' && b === 'quiz') screen = <Quiz key={path} />;
  else if (a === 'nepal') screen = <NepalHub />;
  else if (a === 'stickers') screen = <StickerBook />;
  else if (a === 'parents') screen = <ParentZone />;
  else screen = <Home onSwitchPlayer={() => setStarted(false)} />;

  return <div class="app-root" key={a ?? 'home'}>{screen}</div>;
}
