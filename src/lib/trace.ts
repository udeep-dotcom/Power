// Tracing evaluation without stroke-order data.
//
// We rasterise the target letter into a low-res mask (GRID×GRID) and the child's strokes into
// another mask of the same size, then measure:
//   coverage  = share of letter cells the child painted        ("did you trace all of it?")
//   precision = share of painted cells that are near the letter ("did you stay on the letter?")
// "Near" uses a dilated letter mask so small wobbles are forgiven — these are 4-year-olds.
// Excess ink (far more paint than the letter has) also lowers precision, so filling in the
// letter's bounding box can't earn full marks.
// Limitation (documented): this does not check stroke ORDER or DIRECTION. Proper Devanagari
// stroke-order animation needs hand-authored stroke paths for all 49 letters (roadmap).

export const GRID = 64;

export type Mask = Uint8Array; // GRID*GRID, 1 = filled

export function dilate(m: Mask, r = 1): Mask {
  const out = new Uint8Array(m.length);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!m[y * GRID + x]) continue;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < GRID && ny < GRID) out[ny * GRID + nx] = 1;
        }
      }
    }
  }
  return out;
}

export interface TraceScore { coverage: number; precision: number; stars: number; inkRatio: number }

/** `ease` (0–0.15) lowers the star thresholds for younger children (see lib/level.ts). */
export function scoreTrace(letter: Mask, drawn: Mask, ease = 0): TraceScore {
  const near = dilate(letter, 3);
  let letterCells = 0, covered = 0, drawnCells = 0, onLetter = 0;
  for (let i = 0; i < letter.length; i++) {
    if (letter[i]) { letterCells++; if (drawn[i]) covered++; }
    if (drawn[i]) { drawnCells++; if (near[i]) onLetter++; }
  }
  const coverage = letterCells ? covered / letterCells : 0;
  const inkRatio = letterCells ? drawnCells / letterCells : 0;
  // Colouring in the letter's whole box keeps most ink "near" a dense letter, so nearness alone
  // can't catch it. Measured (see docs/GAME_DESIGN.md §4.1): careful traces use ≤ 1.33× the
  // letter's area in ink; box scribbles use 1.39–1.77×. Excess ink beyond 1.3× lowers precision.
  const tidy = Math.max(0, Math.min(1, 1 - (inkRatio - 1.3) / 0.4));
  const precision = drawnCells ? (onLetter / drawnCells) * tidy : 0;
  return { coverage, precision, inkRatio, stars: starsFor(coverage, precision, ease) };
}

export function starsFor(coverage: number, precision: number, ease = 0): number {
  if (coverage >= 0.8 - ease && precision >= 0.8 - ease) return 3;
  if (coverage >= 0.65 - ease && precision >= 0.65 - ease) return 2;
  if (coverage >= 0.5 - ease && precision >= 0.5 - ease) return 1;
  return 0;
}

/** Read a canvas into a GRID×GRID mask (cell is filled if any sampled pixel has alpha). */
export function maskFromCanvas(c: HTMLCanvasElement, alphaThreshold = 40): Mask {
  const small = document.createElement('canvas');
  small.width = small.height = GRID;
  const g = small.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingEnabled = true;
  g.drawImage(c, 0, 0, GRID, GRID);
  const data = g.getImageData(0, 0, GRID, GRID).data;
  const m = new Uint8Array(GRID * GRID);
  for (let i = 0; i < m.length; i++) m[i] = data[i * 4 + 3] > alphaThreshold ? 1 : 0;
  return m;
}
