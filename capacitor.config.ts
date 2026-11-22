import type { CapacitorConfig } from '@capacitor/cli';

// Android wrapper for the web game. The web build (dist/) is bundled INSIDE the APK, so the
// app works fully offline — no server, no data costs for families.
const config: CapacitorConfig = {
  appId: 'np.aksharyatra.app', // ⚠ change to a domain you control before publishing
  appName: 'अक्षर यात्रा',
  webDir: 'dist',
  android: {
    backgroundColor: '#bfe7ff',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false, // hidden by the app once the first screen has rendered
      backgroundColor: '#bfe7ff',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
  },
};

export default config;
