// UI scale for big screens. The game is designed for a ~420 px-wide phone; on tablets (common
// in schools) and desktops everything would otherwise stay phone-sized in the middle of the
// screen. We zoom the whole app so a tablet shows the same layout, larger.
// Phones are never shrunk: small text and targets hurt young children more than scrolling does.

let scale = 1;

export function uiScale(): number { return scale; }

export function applyUiScale(root: HTMLElement): void {
  const compute = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const s = Math.max(1, Math.min(w / 430, h / 780, 1.7));
    scale = Math.round(s * 100) / 100;
    (root.style as CSSStyleDeclaration & { zoom: string }).zoom = scale === 1 ? '' : String(scale);
    document.documentElement.style.setProperty('--ui-scale', String(scale));
  };
  compute();
  window.addEventListener('resize', compute);
}

/** Convert a viewport-pixel distance into the app's (zoomed) CSS pixels. */
export const toAppPx = (px: number) => px / scale;
