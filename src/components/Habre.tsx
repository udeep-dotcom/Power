// Habre (हाब्रे) — the red panda guide, wearing a Dhaka topi.
// Red pandas live in Nepal's mountain forests, so the mascot is itself a lesson about Nepal.

export type Mood = 'idle' | 'happy' | 'wave' | 'think' | 'oops';

export function Habre({ size = 140, mood = 'idle', face = false }: { size?: number; mood?: Mood; face?: boolean }) {
  const happy = mood === 'happy' || mood === 'wave';
  const vb = face ? '20 18 160 130' : '0 0 200 220';
  return (
    <svg class={`habre mood-${mood}`} width={size} height={face ? size * (130 / 160) : size * 1.1} viewBox={vb} role="img" aria-label="Habre the red panda">
      <defs>
        <radialGradient id="hb-fur" cx="0.45" cy="0.35" r="0.7">
          <stop offset="0" stop-color="#f08a4b" /><stop offset="0.6" stop-color="#d9622a" /><stop offset="1" stop-color="#b44a1c" />
        </radialGradient>
        <linearGradient id="hb-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b2c12" /><stop offset="1" stop-color="#3f1a0b" /></linearGradient>
        <pattern id="hb-dhaka" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#fdf3e1" />
          <path d="M0 5 L5 0 L10 5 L5 10 Z" fill="#e2384f" />
          <path d="M2.5 5 L5 2.5 L7.5 5 L5 7.5 Z" fill="#1d4fb0" />
          <rect x="0" y="0" width="2" height="2" fill="#2fa36b" /><rect x="8" y="8" width="2" height="2" fill="#ffb11b" />
        </pattern>
      </defs>

      {!face && (
        <g class="hb-body">
          {/* tail with rings */}
          <g class="hb-tail">
            <path d="M128 170 C170 168 188 140 178 112 C172 96 156 98 160 114 C166 136 150 152 124 154 Z" fill="url(#hb-fur)" />
            <path d="M170 118 C175 128 172 140 165 148" stroke="#7a3214" stroke-width="7" fill="none" stroke-linecap="round" />
            <path d="M158 104 C164 100 172 102 175 108" stroke="#7a3214" stroke-width="6" fill="none" stroke-linecap="round" />
            <path d="M152 156 C146 160 140 162 134 163" stroke="#7a3214" stroke-width="7" fill="none" stroke-linecap="round" />
          </g>
          {/* body */}
          <path d="M62 120 C52 150 56 192 100 196 C144 192 148 150 138 120 Z" fill="url(#hb-fur)" />
          <path d="M78 140 C74 162 80 186 100 188 C120 186 126 162 122 140 C112 150 88 150 78 140 Z" fill="url(#hb-dark)" />
          {/* feet */}
          <ellipse cx="80" cy="198" rx="16" ry="10" fill="url(#hb-dark)" />
          <ellipse cx="120" cy="198" rx="16" ry="10" fill="url(#hb-dark)" />
          {/* arms */}
          <path class="hb-arm-l" d="M66 132 C52 146 54 166 66 170 C74 168 76 156 78 146 Z" fill="url(#hb-dark)" />
          <g class="hb-arm-r">
            <path d="M134 132 C148 146 146 166 134 170 C126 168 124 156 122 146 Z" fill="url(#hb-dark)" />
          </g>
        </g>
      )}

      <g class="hb-head">
        {/* ears */}
        <path d="M44 62 C38 36 52 24 70 34 C66 44 58 54 52 66 Z" fill="url(#hb-fur)" />
        <path d="M49 58 C46 42 54 34 64 38 C60 46 56 52 53 60 Z" fill="#fff3e3" />
        <path d="M52 56 C51 46 55 41 61 42 C58 48 56 52 54 58 Z" fill="#5a2410" />
        <path d="M156 62 C162 36 148 24 130 34 C134 44 142 54 148 66 Z" fill="url(#hb-fur)" />
        <path d="M151 58 C154 42 146 34 136 38 C140 46 144 52 147 60 Z" fill="#fff3e3" />
        <path d="M148 56 C149 46 145 41 139 42 C142 48 144 52 146 58 Z" fill="#5a2410" />

        {/* head */}
        <ellipse cx="100" cy="86" rx="62" ry="52" fill="url(#hb-fur)" />
        {/* white face mask */}
        <path d="M58 96 C56 120 76 136 100 136 C124 136 144 120 142 96 C132 104 118 104 110 98 C106 104 94 104 90 98 C82 104 68 104 58 96 Z" fill="#fff6ea" />
        <ellipse cx="74" cy="64" rx="10" ry="6" fill="#fff6ea" transform="rotate(-12 74 64)" />
        <ellipse cx="126" cy="64" rx="10" ry="6" fill="#fff6ea" transform="rotate(12 126 64)" />
        {/* tear marks */}
        <path d="M78 92 C76 104 74 112 68 118" stroke="#9b3a12" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75" />
        <path d="M122 92 C124 104 126 112 132 118" stroke="#9b3a12" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75" />

        {/* eyes */}
        {happy ? (
          <g stroke="#2a130a" stroke-width="5" fill="none" stroke-linecap="round">
            <path d="M68 86 Q78 74 88 86" /><path d="M112 86 Q122 74 132 86" />
          </g>
        ) : (
          <g class="hb-eyes">
            <ellipse cx="78" cy="84" rx="9.5" ry="11" fill="#2a130a" />
            <ellipse cx="122" cy="84" rx="9.5" ry="11" fill="#2a130a" />
            <circle cx="81.5" cy="79.5" r="3.6" fill="#fff" /><circle cx="125.5" cy="79.5" r="3.6" fill="#fff" />
            <circle cx="75.5" cy="88" r="1.6" fill="#fff" opacity=".8" /><circle cx="119.5" cy="88" r="1.6" fill="#fff" opacity=".8" />
          </g>
        )}
        {/* cheeks */}
        <ellipse cx="66" cy="104" rx="9" ry="5.5" fill="#ff8a8a" opacity=".45" />
        <ellipse cx="134" cy="104" rx="9" ry="5.5" fill="#ff8a8a" opacity=".45" />
        {/* nose + mouth */}
        <path d="M92 101 C92 97 108 97 108 101 C108 106 103 109 100 109 C97 109 92 106 92 101 Z" fill="#2a130a" />
        <ellipse cx="97" cy="100.5" rx="3" ry="1.6" fill="#fff" opacity=".5" />
        {mood === 'happy' || mood === 'wave' ? (
          <path d="M88 113 Q100 130 112 113 Q100 118 88 113 Z" fill="#7a1f1f" stroke="#2a130a" stroke-width="3" stroke-linejoin="round" />
        ) : mood === 'oops' ? (
          <ellipse cx="100" cy="118" rx="5" ry="6" fill="#7a1f1f" stroke="#2a130a" stroke-width="3" />
        ) : (
          <path d="M90 112 Q95 118 100 112 Q105 118 110 112" stroke="#2a130a" stroke-width="3.5" fill="none" stroke-linecap="round" />
        )}

        {/* Dhaka topi */}
        <g class="hb-topi" transform="rotate(-6 100 40)">
          <path d="M70 46 L76 20 C90 14 112 14 126 20 L132 46 C112 40 90 40 70 46 Z" fill="url(#hb-dhaka)" stroke="#5a2410" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M70 46 C90 40 112 40 132 46" stroke="#1d4fb0" stroke-width="4" fill="none" />
        </g>
      </g>
    </svg>
  );
}
