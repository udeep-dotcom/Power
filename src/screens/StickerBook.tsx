import { useEffect, useState } from 'preact/hooks';
import { Bi } from '../components/Bi';
import { Pic } from '../components/Art';
import { Scenery } from '../components/Scenery';
import { TopBar } from '../components/UI';
import { UI, toNeDigits } from '../data/i18n';
import { STICKER_GROUPS, STICKERS, stickerGroup, type Sticker } from '../data/journey';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
import { update, useStore } from '../lib/store';
import { haptic } from '../lib/util';

export function StickerBook() {
  const s = useStore();
  const [open, setOpen] = useState<Sticker | null>(null);
  const fresh = s.newStickers;
  useEffect(() => { if (fresh.length) setTimeout(() => update((st) => { st.newStickers = []; }), 2500); }, []);

  return (
    <div class="screen scroll stickers-screen">
      <Scenery kind="dusk" />
      <TopBar title={<Bi t={UI.stickerBook} />} right={<span class="chip deva">{toNeDigits(s.stickers.length)}/{toNeDigits(STICKERS.length)}</span>} />
      {s.stickers.length === 0 && <p class="empty card"><Bi t={UI.noSticker} /></p>}
      {STICKER_GROUPS.map((g) => {
        const list = STICKERS.filter((st) => stickerGroup(st) === g.id);
        const have = list.filter((st) => s.stickers.includes(st.id)).length;
        return (
          <section key={g.id} class="sticker-section">
            <h2><Bi t={g.title} inline /> <span class="sec-count deva">{toNeDigits(have)}/{toNeDigits(list.length)}</span></h2>
            <div class="sticker-page">
              {list.map((st, i) => {
                const got = s.stickers.includes(st.id);
                return (
                  <button key={st.id} class={`sticker-slot ${got ? 'have' : ''} ${fresh.includes(st.id) ? 'fresh' : ''}`}
                    style={{ animationDelay: `${i * 0.04}s`, '--tilt': `${((i * 37) % 9) - 4}deg` } as never}
                    onClick={() => {
                      if (!got) { sfx.wrong(); return; }
                      sfx.pop(); haptic(); setOpen(st);
                      void instruct({ ne: `${st.name.ne}। ${st.fact.ne}`, en: `${st.name.en}. ${st.fact.en}` });
                    }}>
                    {got ? <span class="sticker"><Pic pic={st.pic} size={60} /></span> : <span class="slot-q">?</span>}
                    <span class="slot-name">{got ? <Bi t={st.name} /> : ''}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {open && (
        <div class="overlay" onClick={() => setOpen(null)}>
          <div class="card celebrate">
            <div class="sticker big"><Pic pic={open.pic} size={130} /></div>
            <h2 class={s.lang === 'ne' ? 'deva' : ''}><Bi t={open.name} /></h2>
            <p class={s.lang === 'ne' ? 'deva' : ''}><Bi t={open.fact} /></p>
          </div>
        </div>
      )}
    </div>
  );
}
