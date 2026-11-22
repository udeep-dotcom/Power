// Parent zone, behind a simple arithmetic gate (Google Play "Designed for Families" expects
// adult-only areas to be gated). Shows real learning data, not vanity metrics.

import { useMemo, useState } from 'preact/hooks';
import { Scenery } from '../components/Scenery';
import { TopBar } from '../components/UI';
import { LETTERS } from '../data/alphabet';
import { UI, type T } from '../data/i18n';
import { STICKERS } from '../data/journey';
import { sfx } from '../lib/sfx';
import { initSpeech, say, voiceSource, type VoiceSource } from '../lib/speech';
import { letterProgress, mastery, resetProgress, update, useStore, type State } from '../lib/store';
import { shuffle, tr } from '../lib/util';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function Gate({ onPass }: { onPass: () => void }) {
  const { a, b, options } = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 6), b = 3 + Math.floor(Math.random() * 6);
    const ans = a * b;
    const set = new Set([ans]);
    while (set.size < 4) set.add(ans + (Math.floor(Math.random() * 9) - 4) * (Math.random() < 0.5 ? 1 : a) || ans + 1);
    return { a, b, options: shuffle([...set].filter((n) => n > 0)) };
  }, []);
  const [wrong, setWrong] = useState(false);
  return (
    <div class="gate card">
      <h2>{tr(UI.parentGate)}</h2>
      <p>{tr(UI.parentGateQ)} <b>{WORDS[a]} × {WORDS[b]}</b></p>
      <div class="gate-opts">
        {options.map((n) => (
          <button key={n} class="btn white" onClick={() => { if (n === a * b) { sfx.correct(); onPass(); } else { sfx.wrong(); setWrong(true); } }}>{n}</button>
        ))}
      </div>
      {wrong && <p class="gate-wrong">✗</p>}
    </div>
  );
}

const VOICE_LABEL: Record<VoiceSource, T> = {
  recorded: { ne: 'रेकर्ड गरिएको आवाज ✓', en: 'Recorded voice ✓' },
  native: { ne: 'फोनको नेपाली आवाज (TTS)', en: "Phone's Nepali text-to-speech" },
  'web-ne': { ne: 'ब्राउजरको नेपाली आवाज', en: 'Browser Nepali voice' },
  'web-hi': { ne: 'हिन्दी आवाज (नेपाली उपलब्ध छैन)', en: 'Hindi voice (no Nepali voice found)' },
  none: { ne: 'आवाज उपलब्ध छैन — चित्र र शब्दले काम चल्छ', en: 'No voice available — games use pictures instead' },
};

function Toggle({ label, value, onChange }: { label: T; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label class="setting">
      <span>{tr(label)}</span>
      <button role="switch" aria-checked={value} class={`switch ${value ? 'on' : ''}`} onClick={() => { sfx.tap(); onChange(!value); }}><i /></button>
    </label>
  );
}

function Dashboard({ s }: { s: State }) {
  const [voice, setVoice] = useState<VoiceSource>(voiceSource());
  const [confirm, setConfirm] = useState(false);
  const learned = LETTERS.filter((l) => s.nodes[`L:${l.id}`]).length;
  const stars = Object.values(s.nodes).reduce((a, b) => a + b, 0);
  const weak = LETTERS.filter((l) => letterProgress(s, l.id).seen).sort((a, b) => mastery(letterProgress(s, a.id)) - mastery(letterProgress(s, b.id))).slice(0, 6);
  const minutes = Math.round(s.playSeconds / 60);

  return (
    <div class="parent-body">
      <section class="card pz-section">
        <h3>{tr(UI.progress)}</h3>
        <div class="stat-row">
          <div class="stat"><b>{learned}<small>/{LETTERS.length}</small></b><span>{tr(UI.lettersLearned)}</span></div>
          <div class="stat"><b>{stars}</b><span>{tr(UI.starsEarned)}</span></div>
          <div class="stat"><b>{s.stickers.length}<small>/{STICKERS.length}</small></b><span>{tr(UI.stickersWon)}</span></div>
          <div class="stat"><b>{minutes}<small>m</small></b><span>{s.lang === 'ne' ? 'खेलेको समय' : 'Time played'}</span></div>
        </div>
        <div class="mastery-grid" aria-label="Letter mastery">
          {LETTERS.map((l) => {
            const p = letterProgress(s, l.id);
            const m = mastery(p);
            const hue = p.seen ? Math.round(m * 120) : 0;
            return (
              <span key={l.id} class="m-cell deva" lang="ne" title={`${l.roman}: ${Math.round(m * 100)}%`}
                style={p.seen ? { background: `hsl(${hue} 70% 85%)`, borderColor: `hsl(${hue} 60% 55%)` } : undefined}>{l.char}</span>
            );
          })}
        </div>
        <p class="legend"><i style={{ background: 'hsl(0 70% 85%)' }} /> {s.lang === 'ne' ? 'अभ्यास चाहिन्छ' : 'needs practice'} <i style={{ background: 'hsl(120 70% 85%)' }} /> {s.lang === 'ne' ? 'राम्रो' : 'confident'}</p>
        {weak.length > 0 && (
          <p class="weak"><b>{tr(UI.needsAttention)}:</b> <span class="deva" lang="ne">{weak.map((l) => l.char).join('  ')}</span></p>
        )}
      </section>

      <section class="card pz-section">
        <h3>{tr(UI.settings)}</h3>
        <div class="setting">
          <span>{tr(UI.language)}</span>
          <span class="seg">
            <button class={s.lang === 'ne' ? 'on' : ''} onClick={() => update((st) => { st.lang = 'ne'; })}>नेपाली</button>
            <button class={s.lang === 'en' ? 'on' : ''} onClick={() => update((st) => { st.lang = 'en'; })}>English</button>
          </span>
        </div>
        <Toggle label={UI.sound} value={s.sound} onChange={(v) => update((st) => { st.sound = v; })} />
        <Toggle label={UI.voice} value={s.voice} onChange={(v) => update((st) => { st.voice = v; })} />
        <Toggle label={UI.roman} value={s.roman} onChange={(v) => update((st) => { st.roman = v; })} />
        <Toggle label={UI.unlockAll} value={s.unlockAll} onChange={(v) => update((st) => { st.unlockAll = v; })} />
        <div class="setting">
          <span>{tr(UI.voiceStatus)}: <b>{tr(VOICE_LABEL[voice])}</b></span>
          <button class="btn sky" onClick={async () => { await initSpeech(); setVoice(voiceSource()); void say('क, कमलको क', 'chant-ka'); }}>{tr(UI.testVoice)}</button>
        </div>
        <div class="setting">
          {!confirm ? (
            <button class="btn white" onClick={() => setConfirm(true)}>{tr(UI.reset)}</button>
          ) : (
            <span class="confirm">{tr(UI.resetConfirm)}
              <button class="btn crimson" onClick={() => { resetProgress(); setConfirm(false); }}>{tr(UI.yes)}</button>
              <button class="btn white" onClick={() => setConfirm(false)}>{tr(UI.no)}</button>
            </span>
          )}
        </div>
      </section>

      <section class="card pz-section credits">
        <h3>{tr(UI.credits)}</h3>
        <p>Emoji graphics: Twemoji by Twitter/X and contributors, CC-BY 4.0 · Map boundary: official 2020 map of Nepal via “nepali-geo-pro-max” (MIT) · Fonts: Noto Sans Devanagari & Baloo 2 (SIL OFL 1.1).</p>
        <p>{s.lang === 'ne' ? 'यो एपले कुनै विज्ञापन, ट्र्याकिङ वा अनलाइन खाता प्रयोग गर्दैन। सबै प्रगति यही उपकरणमा मात्र बस्छ।' : 'No ads, no tracking, no accounts. All progress stays on this device.'}</p>
      </section>
    </div>
  );
}

export function ParentZone() {
  const s = useStore();
  const [ok, setOk] = useState(false);
  return (
    <div class="screen scroll parent-zone">
      <Scenery kind="home" />
      <TopBar title={tr(UI.parents)} />
      {ok ? <Dashboard s={s} /> : <Gate onPass={() => setOk(true)} />}
    </div>
  );
}
