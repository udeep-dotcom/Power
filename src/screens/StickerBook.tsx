import { useEffect, useState } from 'preact/hooks';
import { Pic } from '../components/Art';
import { Scenery } from '../components/Scenery';
import { TopBar } from '../components/UI';
import { UI } from '../data/i18n';
import { STICKERS, type Sticker } from '../data/journey';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
import { update, useStore } from '../lib/store';
import { haptic, tr } from '../lib/util';

export function StickerBook() {
  const s = useStore();
  const [open, setOpen] = useState<Sticker | null>(null);
  const fresh = s.newStickers;
  useEffect(() => { if (fresh.length) setTimeout(() => update((st) => { st.newStickers = []; }), 2500); }, []);

  return (
    <div class="screen scroll stickers-screen">
      <Scenery kind="dusk" />
      <TopBar title={tr(UI.stickerBook)} right={<span class="chip">{s.stickers.length}/{STICKERS.length}</span>} />
      {s.stickers.length === 0 && <p class="empty card">{tr(UI.noSticker)}</p>}
      <div class="sticker-page">
        {STICKERS.map((st, i) => {
          const have = s.stickers.includes(st.id);
          return (
            <button key={st.id} class={`sticker-slot ${have ? 'have' : ''} ${fresh.includes(st.id) ? 'fresh' : ''}`}
              style={{ animationDelay: `${i * 0.04}s`, '--tilt': `${((i * 37) % 9) - 4}deg` } as never}
              onClick={() => {
                if (!have) { sfx.wrong(); return; }
                sfx.pop(); haptic(); setOpen(st);
                void instruct({ ne: `${st.name.ne}। ${st.fact.ne}`, en: `${st.name.en}. ${st.fact.en}` });
              }}>
              {have ? <span class="sticker"><Pic pic={st.pic} size={64} /></span> : <span class="slot-q">?</span>}
              <span class={`slot-name ${s.lang === 'ne' ? 'deva' : ''}`}>{have ? tr(st.name) : ''}</span>
            </button>
          );
        })}
      </div>
      {open && (
        <div class="overlay" onClick={() => setOpen(null)}>
          <div class="card celebrate">
            <div class="sticker big"><Pic pic={open.pic} size={130} /></div>
            <h2 class={s.lang === 'ne' ? 'deva' : ''}>{tr(open.name)}</h2>
            <p class={s.lang === 'ne' ? 'deva' : ''}>{tr(open.fact)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
