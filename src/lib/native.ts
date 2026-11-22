// Android-only behaviour (no-ops on the web): hardware back button and splash screen.
// System bars / edge-to-edge are configured declaratively in capacitor.config.ts (SystemBars).

import { currentRoute, goBack } from './router';

export async function initNative(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    document.documentElement.classList.add('native');

    const { App } = await import('@capacitor/app');
    // Hardware back = in-app back. Only exit from the home screen, never mid-lesson.
    App.addListener('backButton', () => {
      if (currentRoute() === '/') void App.minimizeApp();
      else goBack('/');
    });

    const { SplashScreen } = await import('@capacitor/splash-screen');
    setTimeout(() => void SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {}), 200);
  } catch { /* web */ }
}
