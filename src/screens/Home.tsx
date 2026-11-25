// Home: the Journey hero card on top, then eight big picture tiles a 3-year-old can choose from
// without reading — अक्षर, ए बी सी, ध्वनि, शब्द, अङ्क, कथा, मेरो नेपाल, खेल. Labels are Nepali-first.

import { Icon, NepalFlag, Pic } from '../components/Art';
import { Bi } from '../components/Bi';
import { PrayerFlags, Scenery } from '../components/Scenery';
import { HabreSays } from '../components/UI';
import { LETTERS } from '../data/alphabet';
import { UI, toNeDigits, type T } from '../data/i18n';
import { navigate } from '../lib/router';
import { sfx } from '../lib/sfx';
import { activeProfile, learnedLetterIds, today, useStore } from '../lib/store';
import { haptic, tileVars, tr } from '../lib/util';

/** Minimum letters learned before "Today's practice" appears (needs enough to mix). */
export const PRACTICE_MIN = 4;

interface Tile { path: string; title: T; color: string; art: preact.JSX.Element }

export function Home({ onSwitchPlayer }: { onSwitchPlayer: () => void }) {
  const s = useStore();
  const learned = learnedLetterIds(s).length;
  const fresh = learned === 0;
  const num = (n: number) => toNeDigits(n); // Nepali numerals everywhere children look
  const go = (p: string) => () => { sfx.tap(); haptic(); navigate(p); };
  const me = activeProfile(s);
  const practicedToday = s.practiceDays.includes(today());

  const tiles: Tile[] = [
    { path: '/letters', title: UI.letters, color: '#1d4fb0', art: <span class="tile-glyph deva" lang="ne">क</span> },
    { path: '/abc', title: UI.abc, color: '#e0457b', art: <span class="tile-glyph latin">Abc</span> },
    { path: '/sounds', title: UI.sounds, color: '#d9452b', art: <Pic pic="👄" size={52} /> },
    { path: '/words', title: UI.words, color: '#e8505b', art: <Pic pic="👨‍👩‍👧‍👦" size={58} /> },
    { path: '/numbers', title: UI.numbers, color: '#ff9f1c', art: <span class="tile-glyph deva" lang="ne">१२३</span> },
    { path: '/stories', title: UI.stories, color: '#8e5bd6', art: <Pic pic="📖" size={58} /> },
    { path: '/nepal', title: UI.myNepal, color: '#2fa36b', art: <NepalFlag size={58} wave /> },
    { path: '/play', title: UI.playHub, color: '#17a2b8', art: <Pic pic="🥁" size={58} /> },
  ];

  return (
    <div class="screen scroll home">
      <Scenery kind="home" />
      <PrayerFlags />

      <div class="home-col">
        <div class="home-head">
          {s.profiles.length > 1 ? (
            <button class="btn white round player-btn" aria-label={tr(UI.whoPlays)} onClick={() => { sfx.tap(); onSwitchPlayer(); }}>
              <Pic pic={me.avatar} size={34} />
            </button>
          ) : <span />}
          <header class="logo">
            <span class="logo-ne deva" lang="ne">अक्षर <em>यात्रा</em></span>
            <span class="logo-en">Akshar Yatra</span>
          </header>
          <div class="home-corner">
            <button class="btn marigold round" aria-label={tr(UI.stickers)} onClick={go('/stickers')}>
              <Pic pic="🏅" size={30} />
              {s.newStickers.length > 0 && <span class="badge">{num(s.newStickers.length)}</span>}
            </button>
            <button class="btn white round" aria-label={tr(UI.parents)} onClick={go('/parents')}><Icon name="gear" /></button>
          </div>
        </div>

        <div class="home-habre">
          <HabreSays text={fresh ? UI.hello : UI.welcomeBack} mood="wave" size={96} speakOnMount={false} />
        </div>

        <button class="journey-hero" onClick={go('/journey')}>
          <span class="jh-art"><Pic pic="🏔️" size={70} /><span class="jh-flag"><NepalFlag size={30} wave /></span></span>
          <span class="jh-text">
            <span class="jh-title"><Bi t={UI.play} /></span>
            <span class="jh-bar"><i style={{ width: `${(learned / LETTERS.length) * 100}%` }} /></span>
            <span class="jh-count deva" lang="ne">{num(learned)}/{num(LETTERS.length)} अक्षर</span>
          </span>
          <span class="jh-go"><Icon name="next" size={34} /></span>
        </button>

        {learned >= PRACTICE_MIN && (
          <button class={`practice-btn ${practicedToday ? 'done' : ''}`} onClick={go('/practice')}>
            <Pic pic={practicedToday ? '✅' : '⭐'} size={28} />
            <Bi t={UI.todaysPractice} />
          </button>
        )}

        <nav class="home-grid">
          {tiles.map((t, i) => (
            <button key={t.path} class="home-tile" style={{ ...tileVars('tc', t.color), animationDelay: `${0.05 + i * 0.05}s` } as never} onClick={go(t.path)}>
              <span class="ht-art">{t.art}</span>
              <span class="ht-label"><Bi t={t.title} /></span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
