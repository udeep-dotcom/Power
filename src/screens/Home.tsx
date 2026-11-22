import { Icon, NepalFlag, Pic } from '../components/Art';
import { PrayerFlags, Scenery } from '../components/Scenery';
import { HabreSays } from '../components/UI';
import { LETTERS } from '../data/alphabet';
import { UI, toNeDigits } from '../data/i18n';
import { navigate } from '../lib/router';
import { sfx } from '../lib/sfx';
import { activeProfile, learnedLetterIds, today, useStore } from '../lib/store';
import { haptic, tr } from '../lib/util';

/** Minimum letters learned before "Today's practice" appears (needs enough to mix). */
export const PRACTICE_MIN = 4;

export function Home({ onSwitchPlayer }: { onSwitchPlayer: () => void }) {
  const s = useStore();
  const learned = learnedLetterIds(s).length;
  const fresh = learned === 0;
  const num = (n: number) => (s.lang === 'ne' ? toNeDigits(n) : String(n));
  const go = (p: string) => () => { sfx.tap(); haptic(); navigate(p); };
  const me = activeProfile(s);
  const practicedToday = s.practiceDays.includes(today());

  return (
    <div class="screen home">
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
          <HabreSays text={fresh ? UI.hello : UI.welcomeBack} mood="wave" size={110} speakOnMount={false} />
        </div>

        {learned >= PRACTICE_MIN && (
          <button class={`practice-btn ${practicedToday ? 'done' : ''}`} onClick={go('/practice')}>
            <Pic pic={practicedToday ? '✅' : '⭐'} size={30} />
            <span class={s.lang === 'ne' ? 'deva' : ''}>{tr(UI.todaysPractice)}</span>
          </button>
        )}

        <nav class="home-menu">
          <button class="btn crimson big menu-btn" onClick={go('/journey')}>
            <span class="menu-ico"><Pic pic="🏔️" size={40} /></span>
            <span class="menu-label">{tr(UI.play)}</span>
            <span class="menu-chip">{num(learned)}/{num(LETTERS.length)}</span>
          </button>
          <div class="menu-row">
            <button class="btn blue big menu-btn" onClick={go('/letters')}>
              <span class="menu-ico deva letter-ico" lang="ne">क</span>
              <span class="menu-label">{tr(UI.letters)}</span>
            </button>
            <button class="btn plum big menu-btn" onClick={go('/barakhari')}>
              <span class="menu-ico deva letter-ico" lang="ne">का</span>
              <span class="menu-label">{tr(UI.barakhari)}</span>
            </button>
          </div>
          <button class="btn big menu-btn" onClick={go('/nepal')}>
            <span class="menu-ico"><NepalFlag size={40} wave /></span>
            <span class="menu-label">{tr(UI.myNepal)}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
