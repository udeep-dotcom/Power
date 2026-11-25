// A friendly side view of a head (facing right) that shows WHERE a sound is made, plus three
// "feel it" cues children can check on their own body:
//   🕯️ air  — a candle flame flickers for breathy sounds (महाप्राण: ख घ छ झ …)
//   🐝 buzz — wavy lines on the throat for voiced sounds (घोष: ग घ ज …) — "touch your throat!"
//   👃 nose — air comes out of the nose for nasal sounds (ङ ञ ण न म)
import type { Place } from '../data/phonics';

const SPOT: Record<Place, [number, number]> = {
  throat: [118, 92], palate: [140, 76], roof: [160, 78], teeth: [176, 92], lips: [190, 101],
};

export function Mouth({ place, air = false, buzz = false, nose = false, pulse = 0, size = 220 }: {
  place?: Place; air?: boolean; buzz?: boolean; nose?: boolean; pulse?: number; size?: number;
}) {
  const spot = place ? SPOT[place] : null;
  return (
    <svg class="mouth" width={size} height={size * 0.78} viewBox="0 0 240 188" role="img" aria-label={place ?? 'mouth'}>
      {/* head and neck */}
      <path d="M40 188 L40 96 C40 40 84 12 132 12 C170 12 196 34 200 62 L214 80 C216 84 212 86 206 86 L206 92 C210 96 208 100 202 100
               C206 104 204 110 198 112 L200 122 C198 134 186 140 170 140 L150 142 L146 188 Z"
        fill="#ffd7b0" stroke="#c98a5a" stroke-width="3" stroke-linejoin="round" />
      {/* hair + ear */}
      <path d="M44 92 C40 40 86 8 136 12 C120 22 104 26 92 40 C76 58 62 74 44 92 Z" fill="#3b2a20" />
      <ellipse cx="78" cy="96" rx="12" ry="17" fill="#f6c193" stroke="#c98a5a" stroke-width="3" />
      <circle cx="166" cy="50" r="5" fill="#3b2a20" />
      {/* nasal passage */}
      <path d="M112 70 C140 62 176 62 204 80" fill="none" stroke="#e9a6a0" stroke-width="6" stroke-linecap="round" opacity=".7" />
      {/* mouth cavity + throat tube */}
      <path d="M196 98 C180 84 152 76 128 80 C116 84 110 92 108 104 L108 188 L128 188 L128 112 C132 104 146 100 160 104 C172 106 184 106 196 104 Z"
        fill="#b8434e" />
      {/* palate line */}
      <path d="M196 96 C180 82 150 74 124 82" fill="none" stroke="#ff9aa6" stroke-width="4" stroke-linecap="round" />
      {/* tongue — curls up a little for the retroflex row */}
      <path d={place === 'roof'
        ? 'M120 128 C120 108 140 98 158 96 C166 90 168 84 162 84 C176 90 178 104 170 110 C150 114 132 124 120 128 Z'
        : 'M120 128 C122 108 150 100 176 102 C186 104 186 112 176 114 C152 118 134 124 120 128 Z'}
        fill="#ff7a8a" stroke="#d6525f" stroke-width="2.5" />
      {/* teeth + lips */}
      <rect x="180" y="90" width="9" height="8" rx="2" fill="#fff" stroke="#ddd" />
      <rect x="180" y="104" width="9" height="7" rx="2" fill="#fff" stroke="#ddd" />
      <path d="M190 92 C198 92 204 96 202 100 C198 100 194 98 190 98 Z" fill="#e8687a" />
      <path d="M190 104 C196 104 202 106 198 112 C194 112 190 110 190 106 Z" fill="#e8687a" />

      {/* place highlight */}
      {spot && (
        <g key={`${place}-${pulse}`} class="mouth-spot">
          <circle cx={spot[0]} cy={spot[1]} r="16" fill="#ffd23f" opacity=".35" class="spot-wave" />
          <circle cx={spot[0]} cy={spot[1]} r="8" fill="#ffd23f" stroke="#fff" stroke-width="3" />
        </g>
      )}
      {/* buzz: throat vibration */}
      <g class={`buzz ${buzz ? 'on' : ''}`} key={`b${pulse}`} stroke="#8e5bd6" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M96 150 q-6 -5 0 -10 q6 -5 0 -10" /><path d="M86 154 q-8 -7 0 -14 q8 -7 0 -14" />
        <path d="M140 150 q6 -5 0 -10 q-6 -5 0 -10" /><path d="M150 154 q8 -7 0 -14 q-8 -7 0 -14" />
      </g>
      {/* nose air */}
      <g class={`nose-air ${nose ? 'on' : ''}`} key={`n${pulse}`} stroke="#4d8dff" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M216 76 l10 -6" /><path d="M218 84 l12 0" />
      </g>
      {/* air: candle in front of the mouth */}
      <g transform="translate(222 112)">
        <rect x="-5" y="18" width="10" height="34" rx="3" fill="#fff3d6" stroke="#d9b98a" stroke-width="2" />
        <line x1="0" y1="18" x2="0" y2="12" stroke="#3b2a20" stroke-width="2" />
        <path class={`flame ${air ? 'blow' : ''}`} key={`f${pulse}`} d="M0 -6 C6 2 6 8 0 12 C-6 8 -6 2 0 -6 Z" fill="#ffb11b" stroke="#ff7a1a" stroke-width="1.5" />
      </g>
    </svg>
  );
}
