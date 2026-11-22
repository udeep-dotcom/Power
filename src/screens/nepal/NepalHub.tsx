import { Pic } from '../../components/Art';
import { Bi } from '../../components/Bi';
import { Scenery } from '../../components/Scenery';
import { HabreSays, TopBar } from '../../components/UI';
import { UI, toNeDigits } from '../../data/i18n';
import { DECKS, PROVINCES } from '../../data/nepal';
import { navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { useStore } from '../../lib/store';
import { haptic, tileVars } from '../../lib/util';

export function NepalHub() {
  const s = useStore();
  const go = (p: string) => () => { sfx.tap(); haptic(); navigate(p); };
  const tiles = [
    { path: '/nepal/map', pic: '🗺️', title: UI.map, color: '#1d4fb0', progress: `${toNeDigits(s.provincesSeen.length)}/${toNeDigits(PROVINCES.length)}` },
    ...DECKS.map((d) => ({ path: `/nepal/deck/${d.id}`, pic: d.pic, title: d.title, color: d.color, progress: `${toNeDigits(d.cards.filter((c) => s.cardsSeen.includes(`${d.id}:${c.id}`)).length)}/${toNeDigits(d.cards.length)}` })),
    { path: '/nepal/quiz', pic: '🏆', title: UI.quiz, color: '#8e5bd6', progress: s.quizBest ? `★ ${toNeDigits(s.quizBest)}` : '' },
  ];
  return (
    <div class="screen scroll nepal-hub">
      <Scenery kind="himal" />
      <TopBar title={<Bi t={UI.myNepal} />} />
      <HabreSays text={{ ne: 'हाम्रो देश नेपालबारे के सिक्ने?', en: 'What shall we learn about Nepal?' }} size={80} />
      <div class="hub-grid">
        {tiles.map((t, i) => (
          <button key={t.path} class="hub-tile" style={{ ...tileVars('tc', t.color), animationDelay: `${i * 0.06}s` } as never} onClick={go(t.path)}>
            <span class="hub-pic"><Pic pic={t.pic} size={64} /></span>
            <span class={`hub-title ${s.lang === 'ne' ? 'deva' : ''}`}><Bi t={t.title} /></span>
            {t.progress && <span class="hub-progress">{t.progress}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
