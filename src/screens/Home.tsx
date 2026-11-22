import { Icon, NepalFlag, Pic } from '../components/Art';
import { PrayerFlags, Scenery } from '../components/Scenery';
import { HabreSays } from '../components/UI';
import { LETTERS } from '../data/alphabet';
import { UI, toNeDigits } from '../data/i18n';
import { navigate } from '../lib/router';
import { sfx } from '../lib/sfx';
import { useStore } from '../lib/store';
import { haptic, tr } from '../lib/util';

export function Home() {
  const s = useStore();
  const learned = LETTERS.filter((l) => s.nodes[`L:${l.id}`]).length;
  const fresh = learned === 0;
  const num = (n: number) => (s.lang === 'ne' ? toNeDigits(n) : String(n));
  const go = (p: string) => () => { sfx.tap(); haptic(); navigate(p); };

  return (
    <div class="screen home">
      <Scenery kind="home" />
      <PrayerFlags />
      <div class="home-corner">
        <button class="btn marigold round" aria-label={tr(UI.stickers)} onClick={go('/stickers')}>
          <Pic pic="🏅" size={30} />
          {s.newStickers.length > 0 && <span class="badge">{num(s.newStickers.length)}</span>}
        </button>
        <button class="btn white round" aria-label={tr(UI.parents)} onClick={go('/parents')}><Icon name="gear" /></button>
      </div>

      <div class="home-col">
        <header class="logo">
          <span class="logo-ne deva" lang="ne">अक्षर <em>यात्रा</em></span>
          <span class="logo-en">Akshar Yatra</span>
        </header>

        <div class="home-habre">
          <HabreSays text={fresh ? UI.hello : UI.welcomeBack} mood="wave" size={120} speakOnMount={false} />
        </div>

        <nav class="home-menu">
          <button class="btn crimson big menu-btn" onClick={go('/journey')}>
            <span class="menu-ico"><Pic pic="🏔️" size={44} /></span>
            <span class="menu-label">{tr(UI.play)}</span>
            <span class="menu-chip">{num(learned)}/{num(LETTERS.length)}</span>
          </button>
          <button class="btn blue big menu-btn" onClick={go('/letters')}>
            <span class="menu-ico deva letter-ico" lang="ne">क</span>
            <span class="menu-label">{tr(UI.letters)}</span>
          </button>
          <button class="btn big menu-btn" onClick={go('/nepal')}>
            <span class="menu-ico"><NepalFlag size={44} wave /></span>
            <span class="menu-label">{tr(UI.myNepal)}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
