import { useState } from 'preact/hooks';
import { Icon, NepalFlag, Pic } from '../components/Art';
import { Habre } from '../components/Habre';
import { Confetti, Scenery } from '../components/Scenery';
import { TopBar } from '../components/UI';
import { UI } from '../data/i18n';
import { STICKER_BY_ID, UNITS } from '../data/journey';
import { goBack } from '../lib/router';
import { sfx } from '../lib/sfx';
import { instruct } from '../lib/speech';
import { awardSticker, completeNode, useStore } from '../lib/store';
import { haptic, tr } from '../lib/util';

export function Chest({ unitId }: { unitId: string }) {
  const unit = UNITS.find((u) => u.id === unitId) ?? UNITS[0];
  const sticker = STICKER_BY_ID[unit.sticker];
  const s = useStore();
  const [opened, setOpened] = useState(false);
  const [fire, setFire] = useState(0);
  const final = unit.id === UNITS[UNITS.length - 1].id;

  const open = () => {
    if (opened) return;
    sfx.unlock(); haptic('success');
    setOpened(true);
    setTimeout(() => { sfx.fanfare(); setFire(1); }, 350);
    awardSticker(sticker.id);
    completeNode(`S:${unit.id}`, 3);
    setTimeout(() => void instruct({ ne: `${sticker.name.ne}! ${sticker.fact.ne}`, en: `${sticker.name.en}! ${sticker.fact.en}` }), 900);
  };

  return (
    <div class="screen chest-screen">
      <Scenery kind={opened ? unit.region : 'dusk'} />
      <TopBar title={tr(opened ? UI.newSticker : UI.openChest)} />
      <div class="chest-body">
        {!opened ? (
          <button class="gift" onClick={open} aria-label={tr(UI.openChest)}>
            <span class="gift-glow" />
            <Pic pic="🎁" size={170} />
          </button>
        ) : (
          <div class="reveal">
            <span class="rays" />
            <div class="sticker big">
              <Pic pic={sticker.pic} size={150} />
              {final && <span class="summit-flag"><NepalFlag size={60} wave /></span>}
            </div>
            <h2 class={s.lang === 'ne' ? 'deva' : ''}>{tr(sticker.name)}</h2>
            <div class="fact card">
              <Habre size={64} mood="happy" />
              <p class={s.lang === 'ne' ? 'deva' : ''}>{final && s.lang === 'ne' ? 'तिमी सगरमाथाको टुप्पोमा पुग्यौ! ' : final ? 'You reached the top of Sagarmatha! ' : ''}{tr(sticker.fact)}</p>
            </div>
            <button class="btn big crimson" onClick={() => { sfx.tap(); goBack('/journey'); }}>{tr(UI.next)} <Icon name="next" /></button>
          </div>
        )}
      </div>
      <Confetti fire={fire} />
    </div>
  );
}
