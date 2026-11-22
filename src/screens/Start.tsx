// First screen of every session. Two jobs:
//  1. Get the first tap. Browsers and Android block sound until the user touches the screen,
//     so without this Habre's greeting — the most important line in the app — is silent.
//  2. Let siblings on a shared phone pick who's playing.

import { Habre } from '../components/Habre';
import { Pic } from '../components/Art';
import { PrayerFlags, Scenery } from '../components/Scenery';
import { UI } from '../data/i18n';
import { LETTERS } from '../data/alphabet';
import { unlockAudio, sfx } from '../lib/sfx';
import { initSpeech, instruct } from '../lib/speech';
import { getState, learnedLetterIds, switchProfile, useStore, type Profile } from '../lib/store';
import { haptic, tr } from '../lib/util';

export function Start({ onStart }: { onStart: () => void }) {
  const s = useStore();
  const many = s.profiles.length > 1;

  const go = (p: Profile) => {
    unlockAudio();
    sfx.unlock(); haptic('success');
    switchProfile(p.id);
    onStart();
    void initSpeech().then(() => {
      const fresh = learnedLetterIds(getState()).length === 0; // state of the player just chosen
      void instruct(fresh ? UI.hello : UI.welcomeBack);
    });
  };

  return (
    <div class="screen start">
      <Scenery kind="home" />
      <PrayerFlags />
      <div class="start-col">
        <header class="logo">
          <span class="logo-ne deva" lang="ne">अक्षर <em>यात्रा</em></span>
          <span class="logo-en">Akshar Yatra</span>
        </header>
        <div class="start-habre"><Habre size={150} mood="wave" /></div>
        {many ? (
          <>
            <p class={`start-q ${s.lang === 'ne' ? 'deva' : ''}`}>{tr(UI.whoPlays)}</p>
            <div class={`players n${s.profiles.length}`}>
              {s.profiles.map((p, i) => {
                const learned = p.id === s.active ? learnedLetterIds(s).length : Object.keys(p.data?.nodes ?? {}).filter((k) => k.startsWith('L:')).length;
                return (
                  <button key={p.id} class="player" style={{ animationDelay: `${i * 0.07}s` }} onClick={() => go(p)}>
                    <span class="player-face"><Pic pic={p.avatar} size={64} /></span>
                    <span class="player-name">{p.name || `${tr(UI.player)} ${i + 1}`}</span>
                    <span class="player-meta">{learned}/{LETTERS.length}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <button class="btn crimson big start-play" onClick={() => go(s.profiles[0])}>
            <span class="play-tri" aria-hidden="true" />
            <span class={s.lang === 'ne' ? 'deva' : ''}>{tr(UI.letsPlay)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
