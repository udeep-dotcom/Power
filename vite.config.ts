import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         -> dist/ : multi-file build used by the PWA and by Capacitor (Android).
// `npm run build:single`  -> dist-single/index.html : one self-contained file for quick sharing/previews.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [preact(), ...(single ? [viteSingleFile()] : [])],
    define: { __SINGLE_FILE__: JSON.stringify(single) },
    build: {
      outDir: single ? 'dist-single' : 'dist',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      // Android System WebView 88+ (Jan 2021). CSS like `inset` is lowered for older engines;
      // anything that can't be lowered is gated at startup (see src/lib/compat.ts).
      target: ['es2019', 'chrome88'],
      cssTarget: ['chrome88'],
      cssCodeSplit: !single,
    },
    test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
  };
});
