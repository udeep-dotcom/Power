import { render } from 'preact';
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/noto-sans-devanagari/devanagari-600.css';
import '@fontsource/noto-sans-devanagari/devanagari-800.css';
import './styles/global.css';
import './styles/art.css';
import './styles/screens.css';
import { App } from './App';
import { hydrateNative } from './lib/store';
import { initSpeech } from './lib/speech';
import { unlockAudio } from './lib/sfx';
import { initNative } from './lib/native';
import { isSupported, renderUnsupported } from './lib/compat';
import { applyUiScale } from './lib/scale';

void hydrateNative();
void initSpeech();
void initNative();
window.addEventListener('pointerdown', unlockAudio, { once: true });

// Offline support for the web build (skipped in the Android app and the single-file preview).
if ('serviceWorker' in navigator && import.meta.env.PROD && !__SINGLE_FILE__ && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

const root = document.getElementById('app')!;
if (isSupported()) { applyUiScale(root); render(<App />, root); }
else renderUnsupported(root);
