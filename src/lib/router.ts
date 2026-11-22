// Minimal hash router. Hash routes work in the browser, the PWA, the single-file preview and
// inside Capacitor's WebView without any server configuration.

import { useEffect, useState } from 'preact/hooks';

export interface Route { path: string; parts: string[] }

function parse(): Route {
  const path = location.hash.replace(/^#/, '') || '/';
  return { path, parts: path.split('/').filter(Boolean) };
}

/** How many in-app screens we can go back through (so "back" never leaves the app). */
let depth = 0;
window.addEventListener('popstate', () => { depth = Math.max(0, depth - 1); });

export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  const url = `#${path}`;
  if (opts.replace) history.replaceState(null, '', url);
  else { history.pushState(null, '', url); depth++; }
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Go back in history, or to `fallback` if this is the first screen of the session. */
export function goBack(fallback = '/'): void {
  if (depth > 0) history.back();
  else navigate(fallback, { replace: true });
}

export function canGoBack(): boolean { return depth > 0 || parse().path !== '/'; }

export function useRoute(): Route {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => setR(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
