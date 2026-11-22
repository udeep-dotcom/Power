// Interactive map of Nepal's 7 provinces (official post-2020 boundary).
// Tap a province → it lifts, Habre reads its name, capital and one fact.

import { useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Pic } from '../../components/Art';
import { Habre } from '../../components/Habre';
import { Scenery } from '../../components/Scenery';
import { Celebration, TopBar } from '../../components/UI';
import { UI, toNeDigits } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { MAP_H, MAP_W, PLACE_XY, PROVINCE_SHAPES } from '../../data/nepalMap.generated';
import { PROVINCES } from '../../data/nepal';
import { goBack } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { instruct } from '../../lib/speech';
import { awardSticker, update, useStore } from '../../lib/store';
import { haptic } from '../../lib/util';

// Hand-tuned label positions so names don't collide with pins or leave narrow provinces.
const LABEL_NUDGE: Record<string, [number, number]> = { P1: [0, 10], P2: [-10, 30], P3: [0, -58], P6: [0, 10], P7: [14, 24] };

export function MapScreen() {
  const s = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const p = PROVINCES.find((x) => x.id === sel);

  const choose = (id: string) => {
    sfx.pop(); haptic();
    setSel(id);
    const pr = PROVINCES.find((x) => x.id === id)!;
    void instruct({
      ne: `${pr.name.ne} प्रदेश। राजधानी ${pr.capital.ne}। ${pr.fact.ne}`,
      en: `${pr.name.en} Province. Capital: ${pr.capital.en}. ${pr.fact.en}`,
    });
    if (!s.provincesSeen.includes(id)) {
      update((st) => { st.provincesSeen.push(id); });
      if (s.provincesSeen.length + 1 === PROVINCES.length && awardSticker('mapper')) setTimeout(() => setCelebrate(true), 2500);
    }
  };

  const n = s.provincesSeen.length;
  return (
    <div class="screen map-screen">
      <Scenery kind="himal" />
      <TopBar title={<Bi t={UI.map} />} right={<span class="chip">{s.lang === 'ne' ? toNeDigits(n) : n}/{s.lang === 'ne' ? '७' : 7}</span>} />
      <div class="map-wrap card">
        <svg class="nepal-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label="Map of Nepal">
          <defs>
            <filter id="map-shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#23223a" flood-opacity=".25" /></filter>
          </defs>
          {PROVINCES.map((pr) => (
            <g key={pr.id} class={`prov ${sel === pr.id ? 'sel' : ''} ${s.provincesSeen.includes(pr.id) ? 'seen' : ''}`}
              style={{ '--pc': pr.color } as never} onClick={() => choose(pr.id)}>
              <path d={PROVINCE_SHAPES[pr.id].fill} class="prov-fill" />
            </g>
          ))}
          {PROVINCES.map((pr) => <path key={pr.id} d={PROVINCE_SHAPES[pr.id].line} class="prov-line" />)}
          {sel && (
            <g class="prov-top" style={{ '--pc': p!.color } as never} filter="url(#map-shadow)" onClick={() => choose(sel)}>
              <path d={PROVINCE_SHAPES[sel].fill} class="prov-fill" />
              <path d={PROVINCE_SHAPES[sel].line} class="prov-line" />
            </g>
          )}
          {PROVINCES.map((pr) => {
            const sh = PROVINCE_SHAPES[pr.id];
            const [nx, ny] = LABEL_NUDGE[pr.id] ?? [0, 0];
            return (
              <text key={pr.id} x={sh.cx + nx} y={sh.cy + ny} class={`prov-label deva ${sel === pr.id ? 'sel' : ''} ${pr.name.ne.length > 8 ? 'long' : ''}`} lang="ne" text-anchor="middle">{pr.name.ne}</text>
            );
          })}
          {/* Kathmandu and Sagarmatha pins */}
          <g class="pin" transform={`translate(${PLACE_XY.kathmandu[0]} ${PLACE_XY.kathmandu[1]})`}>
            <circle r="11" fill="#dc143c" stroke="#fff" stroke-width="4" /><text y="42" text-anchor="middle" class="pin-label deva" lang="ne">काठमाडौं</text>
          </g>
          <g class="pin" transform={`translate(${PLACE_XY.everest[0]} ${PLACE_XY.everest[1]})`}>
            <path d="M0 -16 L14 8 L-14 8 Z" fill="#fff" stroke="#1d4fb0" stroke-width="3.5" stroke-linejoin="round" /><text y="-22" text-anchor="middle" class="pin-label deva" lang="ne">सगरमाथा</text>
          </g>
          {p && (
            <g class="pin cap" transform={`translate(${PLACE_XY[p.capitalPlace][0]} ${PLACE_XY[p.capitalPlace][1]})`}>
              <path d="M0 0 C-12 -14 -12 -30 0 -30 C12 -30 12 -14 0 0 Z" fill="#ffb11b" stroke="#fff" stroke-width="3" /><circle cy="-21" r="4.5" fill="#fff" />
            </g>
          )}
        </svg>
      </div>

      {p ? (
        <div class="prov-card card" key={p.id} style={{ '--pc': p.color } as never}>
          <div class="prov-head">
            <span class={`prov-name ${s.lang === 'ne' ? 'deva' : ''}`}><Bi t={p.name} /></span>
            <span class="prov-pics">{p.pics.map((x) => <Pic key={x} pic={x} size={38} />)}</span>
          </div>
          <div class="prov-cap">📍 <Bi t={UI.capital} />: <b class={s.lang === 'ne' ? 'deva' : ''}><Bi t={p.capital} /></b></div>
          <p class={s.lang === 'ne' ? 'deva' : ''}><Bi t={p.fact} /></p>
        </div>
      ) : (
        <div class="prov-card card hint"><Habre size={60} mood="think" /><span class={s.lang === 'ne' ? 'deva' : ''}><Bi t={UI.tapProvince} /></span></div>
      )}

      {celebrate && (
        <Celebration title={UI.newSticker} subtitle={STICKER_BY_ID.mapper.fact} onNext={() => goBack('/nepal')}>
          <div class="sticker"><Pic pic="🗺️" size={96} /></div>
        </Celebration>
      )}
    </div>
  );
}
