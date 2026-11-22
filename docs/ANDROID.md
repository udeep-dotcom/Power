# Android app

The Android app is the same web game wrapped with **Capacitor 8**. The built web files are bundled
inside the APK, so the app works **fully offline**.

## What is Android-specific

| Concern | How it is handled | Where |
|---|---|---|
| Nepali speech | Android WebView has **no** `speechSynthesis`, so the app calls the phone's native TTS via `@capacitor-community/text-to-speech`, asking for `ne-NP` and falling back to `hi-IN` | `src/lib/speech.ts` |
| Hardware back button | Steps back inside the app; on the home screen it minimises instead of quitting | `src/lib/native.ts` |
| Progress safety | Saved to `localStorage` **and** `@capacitor/preferences`, because the OS can evict WebView storage | `src/lib/store.ts` |
| Haptics | `@capacitor/haptics` (falls back to `navigator.vibrate`) | `src/lib/util.ts` |
| Splash, status bar | `@capacitor/splash-screen` (hidden after first render), transparent status bar | `capacitor.config.ts`, `src/lib/native.ts` |
| Orientation | Portrait (Android 16+ ignores this on tablets, by design) | `android/app/src/main/AndroidManifest.xml` |
| Icons and splash | Generated from `assets/*.png` with `npx capacitor-assets generate --android` | `assets/` |

Minimum Android version: **7.0 (API 24)**. Target: API 36.

## Build an APK

### Option A: GitHub Actions (no setup)
Every push runs `.github/workflows/build.yml`, which uploads **`akshar-yatra-debug-apk`** as a workflow
artifact. Download it, copy it to a phone, and install it (you'll need to allow "install unknown apps").

### Option B: Locally
Requirements: Node 22+, JDK 21, Android Studio (or the Android SDK command-line tools).

```bash
npm ci
npm run android:sync        # vite build + npx cap sync android
npm run android:open        # opens Android Studio → Run ▶ on a device/emulator
# or, headless:
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

After changing web code, run `npm run android:sync` again before rebuilding.

## Before publishing to Google Play

1. **Change `appId`** in `capacitor.config.ts` (currently `np.aksharyatra.app`) to a domain you own, then
   run `npx cap sync`. Also update `applicationId` in `android/app/build.gradle`.
2. Create a **release keystore** (never commit it) and configure `signingConfigs` in Gradle, or use Play
   App Signing.
3. Bump `versionCode` and `versionName` in `android/app/build.gradle` for every release.
4. Enrol in **Designed for Families**: target audience 5–8 (and parents). No ads SDKs. The Data safety
   form is "No data collected". The parent zone is already behind an adult gate.
5. **Test TTS on a real low-end device.** Google's TTS engine includes Nepali, but the voice data may
   need downloading (Settings → System → Languages → Text-to-speech). The Parent zone shows which voice
   source is active and has a "Test voice" button. Recorded audio (see `AUDIO.md`) removes this
   dependency entirely.
6. Optional: the app makes no network requests, so the `INTERNET` permission could be removed from the
   manifest to show "no internet access" on the Play listing. **Test thoroughly on devices first.**

## Verification status

- ✅ The web build runs in Chromium at phone size. Every screen and game was played end to end.
- ✅ The Android project was generated and synced (6 plugins detected) and icons/splash generated.
- ⏳ **The APK compile has not yet run.** The Android SDK host was blocked in the environment that
  produced this build. The CI workflow is the first place it will compile, so check the first run.
