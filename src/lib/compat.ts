// Minimum engine check. The app needs roughly Chrome/Android WebView 88+ (aspect-ratio, flex gap,
// ResizeObserver). Rather than showing a broken game on a very old, never-updated WebView, we
// show parents a clear, bilingual fix.

export function isSupported(): boolean {
  try {
    return typeof ResizeObserver !== 'undefined'
      && typeof CSS !== 'undefined' && CSS.supports('aspect-ratio', '1 / 1')
      && CSS.supports('gap', '1px');
  } catch { return false; }
}

export function renderUnsupported(root: HTMLElement): void {
  root.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#bfe7ff;font-family:sans-serif;color:#23223a;text-align:center">
      <div style="max-width:420px;background:#fff;border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.15)">
        <div lang="ne" style="font-size:64px;font-weight:800;color:#dc143c">अ</div>
        <h1 style="font-size:22px;margin:8px 0" lang="ne">कृपया अपडेट गर्नुहोस्</h1>
        <p style="font-size:16px;line-height:1.5" lang="ne">यो फोनको "Android System WebView" वा "Chrome" पुरानो भयो। Play Store मा गएर अपडेट गर्नुहोस्, अनि एप फेरि खोल्नुहोस्।</p>
        <p style="font-size:15px;line-height:1.5;color:#57566e">This phone's Android System WebView (or Chrome) is too old for this game. Please update it from the Play Store, then reopen the app.</p>
      </div>
    </div>`;
}
