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
import { WordGame, WordsHub, WordTopicScreen } from './screens/words/Words';
import { CountGame, NumbersScreen } from './screens/numbers/Numbers';
import { StoryReader, StoryShelf } from './screens/stories/Stories';
import { MusicScreen, PlayHub } from './screens/play/Music';
import { ColourPage, ColourPicker } from './screens/play/Colouring';
import { BedTime } from './screens/BedTime';
import { MouthMap, SoundsHub } from './screens/sounds/Sounds';
import { AbcHub, AbcLetter } from './screens/sounds/Abc';
import { BlendGame } from './screens/sounds/Blend';
import { FriendsGame, FriendsScreen, PairsGame, SoundHunt } from './screens/sounds/PhonicsGames';
import { MusicDirector } from './lib/music';
import { RequireSounds } from './components/RequireSounds';
import { IdleHand } from './components/IdleHand';
import { PHONICS_NEEDS } from './data/clips';

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
   /words, /words/:topic, /words/:topic/game     first words + listening game
   /numbers, /numbers/game                       numerals १–१० + counting game
   /stories, /stories/:id                        narrated picture stories
   /play, /play/music, /play/colour[/:page]      instruments + colouring
   /sounds, /sounds/mouth[/:letter]               Nepali phonetics: mouth map
   /sounds/blend/:lang, /sounds/pairs/:lang       blending, minimal pairs (ne | en)
   /sounds/friends[/game]                         English ↔ Nepali sound friends
   /abc, /abc/:letter, /abc/hunt                  English letter sounds (phonics)
   /nepal, /nepal/map, /nepal/deck/:id, /nepal/quiz
   /stickers, /parents
*/
export function App() {
  const { parts, path } = useRoute();
  // The start screen shows once per app session (it unlocks audio and picks the player).
  const [started, setStarted] = useState(false);
  useEffect(() => () => stopSpeech(), [path]);
  const [a, b, c] = parts;

  if (!started) return <div class="app-root"><Start onStart={() => setStarted(true)} /><MusicDirector route="start" /><IdleHand path="start" /></div>;

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
  else if (a === 'words' && b && c === 'game') screen = <WordGame key={path} topicId={b} />;
  else if (a === 'words' && b) screen = <WordTopicScreen key={path} topicId={b} />;
  else if (a === 'words') screen = <WordsHub />;
  else if (a === 'numbers' && b === 'game') screen = <CountGame key={path} />;
  else if (a === 'numbers') screen = <NumbersScreen />;
  else if (a === 'stories' && b) screen = <StoryReader key={path} storyId={b} />;
  else if (a === 'stories') screen = <StoryShelf />;
  else if (a === 'play' && b === 'music') screen = <MusicScreen />;
  else if (a === 'play' && b === 'colour' && c) screen = <ColourPage key={path} pageId={c} />;
  else if (a === 'play' && b === 'colour') screen = <ColourPicker />;
  else if (a === 'play') screen = <PlayHub />;
  else if (a === 'sounds' && b === 'mouth') screen = <MouthMap key={path} initial={c} />;
  else if (a === 'sounds' && b === 'blend' && c === 'en') screen = <RequireSounds ids={PHONICS_NEEDS.blendEn} back="/abc"><BlendGame key={path} lang="en" /></RequireSounds>;
  else if (a === 'sounds' && b === 'blend') screen = <BlendGame key={path} lang="ne" />;
  else if (a === 'sounds' && b === 'pairs') screen = <PairsGame key={path} lang={c === 'en' ? 'en' : 'ne'} />;
  else if (a === 'sounds' && b === 'friends' && c === 'game') screen = <RequireSounds ids={PHONICS_NEEDS.friends} back="/sounds/friends"><FriendsGame key={path} /></RequireSounds>;
  else if (a === 'sounds' && b === 'friends') screen = <FriendsScreen />;
  else if (a === 'sounds') screen = <SoundsHub />;
  else if (a === 'abc' && b === 'hunt') screen = <RequireSounds ids={PHONICS_NEEDS.hunt} back="/abc"><SoundHunt key={path} /></RequireSounds>;
  else if (a === 'abc' && b) screen = <AbcLetter key={path} id={b} />;
  else if (a === 'abc') screen = <AbcHub />;
  else if (a === 'nepal' && b === 'map') screen = <MapScreen />;
  else if (a === 'nepal' && b === 'deck' && c) screen = <DeckScreen key={path} deckId={c} />;
  else if (a === 'nepal' && b === 'quiz') screen = <Quiz key={path} />;
  else if (a === 'nepal') screen = <NepalHub />;
  else if (a === 'stickers') screen = <StickerBook />;
  else if (a === 'parents') screen = <ParentZone />;
  else screen = <Home onSwitchPlayer={() => setStarted(false)} />;

  return (
    <>
      <div class="app-root" key={a ?? 'home'}>{screen}</div>
      <MusicDirector route={a ?? ''} />
      <IdleHand path={path} />
      <BedTime />
    </>
  );
}
