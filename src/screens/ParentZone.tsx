// Parent zone, behind a simple arithmetic gate (Google Play "Designed for Families" expects
// adult-only areas to be gated). Shows real learning data per child, not vanity metrics.

import { useMemo, useState } from 'preact/hooks';
import { Pic } from '../components/Art';
import { Scenery } from '../components/Scenery';
import { TopBar } from '../components/UI';
import { LETTERS } from '../data/alphabet';
import { BK_CONSONANTS } from '../data/barakhari';
import { UI, type T } from '../data/i18n';
import { STICKERS } from '../data/journey';
import { sfx } from '../lib/sfx';
import { initSpeech, say, voiceSource, type VoiceSource } from '../lib/speech';
import {
  addProfile, AVATARS, editProfile, emptyProgress, learnedLetterIds, letterProgress, mastery, MAX_PROFILES,
  removeProfile, resetProgress, update, useStore, type Progress, type State,
} from '../lib/store';
import { shuffle, tr } from '../lib/util';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function makeQuestion() {
  const a = 3 + Math.floor(Math.random() * 6), b = 3 + Math.floor(Math.random() * 6);
  const ans = a * b;
  const set = new Set([ans]);
  while (set.size < 4) {
    const delta = (1 + Math.floor(Math.random() * 3)) * (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 1 : a);
    if (ans + delta > 0) set.add(ans + delta);
  }
  return { a, b, options: shuffle([...set]) };
}

function Gate({ onPass }: { onPass: () => void }) {
  const [q, setQ] = useState(makeQuestion);
  const [wrong, setWrong] = useState(false);
  return (
    <div class="gate card">
      <h2>{tr(UI.parentGate)}</h2>
      <p>{tr(UI.parentGateQ)} <b>{WORDS[q.a]} × {WORDS[q.b]}</b></p>
      <div class="gate-opts">
        {q.options.map((n) => (
          <button key={n} class="btn white" onClick={() => {
            if (n === q.a * q.b) { sfx.correct(); onPass(); }
            else { sfx.wrong(); setWrong(true); setQ(makeQuestion()); } // new question: no trial-and-error
          }}>{n}</button>
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

function progressOf(s: State, id: string): Progress {
  if (id === s.active) return s;
  return s.profiles.find((p) => p.id === id)?.data ?? emptyProgress();
}

function Players({ s, viewing, setViewing }: { s: State; viewing: string; setViewing: (id: string) => void }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <section class="card pz-section">
      <h3>{tr(UI.players)}</h3>
      <div class="pz-players">
        {s.profiles.map((p, i) => (
          <div key={p.id} class={`pz-player ${viewing === p.id ? 'on' : ''}`}>
            <button class="pz-avatar" aria-label="Change avatar"
              onClick={() => { sfx.tap(); editProfile(p.id, { avatar: AVATARS[(AVATARS.indexOf(p.avatar) + 1) % AVATARS.length] }); }}>
              <Pic pic={p.avatar} size={40} />
            </button>
            <input id={`pname-${p.id}`} class="pz-name" value={p.name} placeholder={`${tr(UI.player)} ${i + 1}`} maxLength={20}
              aria-label={tr(UI.namePlaceholder)} onChange={(e) => editProfile(p.id, { name: (e.target as HTMLInputElement).value })} />
            <button class="btn white pz-view" onClick={() => setViewing(p.id)}>
              {learnedLetterIds(progressOf(s, p.id)).length}/{LETTERS.length}
            </button>
            {s.profiles.length > 1 && (confirm === p.id ? (
              <span class="confirm">
                <button class="btn crimson" onClick={() => { removeProfile(p.id); setConfirm(null); if (viewing === p.id) setViewing(s.active); }}>{tr(UI.yes)}</button>
                <button class="btn white" onClick={() => setConfirm(null)}>{tr(UI.no)}</button>
              </span>
            ) : (
              <button class="btn white pz-remove" aria-label={tr(UI.removePlayer)} onClick={() => setConfirm(p.id)}>✕</button>
            ))}
          </div>
        ))}
      </div>
      {s.profiles.length < MAX_PROFILES && (
        <button class="btn sky" onClick={() => {
          const used = new Set(s.profiles.map((p) => p.avatar));
          addProfile(AVATARS.find((a) => !used.has(a)) ?? AVATARS[0]);
        }}>＋ {tr(UI.addPlayer)}</button>
      )}
    </section>
  );
}

function Report({ p, lang }: { p: Progress; lang: string }) {
  const learned = learnedLetterIds(p).length;
  const stars = Object.values(p.nodes).reduce((a, b) => a + b, 0);
  const weak = LETTERS.filter((l) => letterProgress(p, l.id).seen).sort((a, b) => mastery(letterProgress(p, a.id)) - mastery(letterProgress(p, b.id))).slice(0, 6);
  const minutes = Math.round(p.playSeconds / 60);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const practiceWeek = p.practiceDays.filter((d) => d >= weekAgo).length;
  return (
    <section class="card pz-section">
      <h3>{tr(UI.progress)}</h3>
      <div class="stat-row">
        <div class="stat"><b>{learned}<small>/{LETTERS.length}</small></b><span>{tr(UI.lettersLearned)}</span></div>
        <div class="stat"><b>{stars}</b><span>{tr(UI.starsEarned)}</span></div>
        <div class="stat"><b>{p.stickers.length}<small>/{STICKERS.length}</small></b><span>{tr(UI.stickersWon)}</span></div>
        <div class="stat"><b>{minutes}<small>m</small></b><span>{lang === 'ne' ? 'खेलेको समय' : 'Time played'}</span></div>
      </div>
      <div class="mastery-grid" aria-label="Letter mastery">
        {LETTERS.map((l) => {
          const lp = letterProgress(p, l.id);
          const m = mastery(lp);
          const hue = lp.seen ? Math.round(m * 120) : 0;
          return (
            <span key={l.id} class="m-cell deva" lang="ne" title={`${l.roman}: ${Math.round(m * 100)}%`}
              style={lp.seen ? { background: `hsl(${hue} 70% 85%)`, borderColor: `hsl(${hue} 60% 55%)` } : undefined}>{l.char}</span>
          );
        })}
      </div>
      <p class="legend"><i style={{ background: 'hsl(0 70% 85%)' }} /> {lang === 'ne' ? 'अभ्यास चाहिन्छ' : 'needs practice'} <i style={{ background: 'hsl(120 70% 85%)' }} /> {lang === 'ne' ? 'राम्रो' : 'confident'} <i style={{ background: '#faf6ef' }} /> {lang === 'ne' ? 'अझै सुरु भएन' : 'not started'}</p>
      {weak.length > 0 && <p class="weak"><b>{tr(UI.needsAttention)}:</b> <span class="deva" lang="ne">{weak.map((l) => l.char).join('  ')}</span></p>}
      <p class="weak">
        <b>{tr(UI.barakhari)}:</b> {p.barakhari.length}/{BK_CONSONANTS.length} {lang === 'ne' ? 'अक्षर खोजेको' : 'consonants explored'}
        {p.nodes['B:game'] ? ` · ${lang === 'ne' ? 'खेल' : 'game'} ${'★'.repeat(p.nodes['B:game'])}` : ''}
      </p>
      <p class="weak"><b>{tr(UI.todaysPractice)}:</b> {practiceWeek} {lang === 'ne' ? 'दिन (पछिल्लो ७ दिनमा)' : 'days in the last 7'}</p>
    </section>
  );
}

function Dashboard({ s }: { s: State }) {
  const [voice, setVoice] = useState<VoiceSource>(voiceSource());
  const [confirm, setConfirm] = useState(false);
  const [viewing, setViewing] = useState(s.active);
  const viewed = useMemo(() => progressOf(s, viewing), [s, viewing]);
  const viewedProfile = s.profiles.find((p) => p.id === viewing) ?? s.profiles[0];

  return (
    <div class="parent-body">
      <Players s={s} viewing={viewing} setViewing={setViewing} />
      {s.profiles.length > 1 && (
        <p class="pz-viewing"><Pic pic={viewedProfile.avatar} size={26} /> {tr(UI.viewing)}: <b>{viewedProfile.name || `${tr(UI.player)} ${s.profiles.indexOf(viewedProfile) + 1}`}</b></p>
      )}
      <Report p={viewed} lang={s.lang} />

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
              <button class="btn crimson" onClick={() => { resetProgress(viewing); setConfirm(false); }}>{tr(UI.yes)}</button>
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
