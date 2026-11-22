// Android-only behaviour (no-ops on the web): hardware back button, status bar, splash screen.

import { goBack } from './router';

export async function initNative(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    document.documentElement.classList.add('native');

    const { App } = await import('@capacitor/app');
    // Hardware back = in-app back. Only exit from the home screen, never mid-lesson.
    App.addListener('backButton', () => {
      const path = location.hash.replace(/^#/, '') || '/';
      if (path === '/') void App.minimizeApp();
      else goBack('/');
    });

    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});

    const { SplashScreen } = await import('@capacitor/splash-screen');
    setTimeout(() => void SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {}), 200);
  } catch { /* web */ }
}
