// Minimal router. Normally hash-based (works in the browser, the PWA and Capacitor's WebView with
// no server config). In the single-file build — which may run inside a sandboxed frame where the
// History API is restricted — it keeps routes in memory instead.

import { useEffect, useState } from 'preact/hooks';

export interface Route { path: string; parts: string[] }

const MEMORY = typeof __SINGLE_FILE__ !== 'undefined' && __SINGLE_FILE__;
const EVT = 'akshar:route';

let memStack: string[] = ['/'];
/** How many in-app screens we can go back through (so "back" never leaves the app). */
let depth = 0;

function currentPath(): string {
  return MEMORY ? memStack[memStack.length - 1] : location.hash.replace(/^#/, '') || '/';
}
function parse(): Route {
  const path = currentPath();
  return { path, parts: path.split('/').filter(Boolean) };
}
const emit = () => window.dispatchEvent(new Event(EVT));

if (!MEMORY) {
  window.addEventListener('popstate', () => { depth = Math.max(0, depth - 1); });
  window.addEventListener('hashchange', emit);
}

export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  if (MEMORY) {
    if (opts.replace) memStack[memStack.length - 1] = path; else memStack.push(path);
    emit();
    return;
  }
  try {
    if (opts.replace) history.replaceState(null, '', `#${path}`);
    else { history.pushState(null, '', `#${path}`); depth++; }
  } catch {
    location.hash = path;
  }
  emit();
}

/** Go back one screen, or to `fallback` if this is the first screen of the session. */
export function goBack(fallback = '/'): void {
  if (MEMORY) {
    if (memStack.length > 1) memStack.pop(); else memStack = [fallback];
    emit();
    return;
  }
  if (depth > 0) history.back();
  else navigate(fallback, { replace: true });
}

export function useRoute(): Route {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => setR(parse());
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return r;
}

/** For the Android back button. */
export function currentRoute(): string { return currentPath(); }
