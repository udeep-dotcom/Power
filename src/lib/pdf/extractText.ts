// pdfjs-dist ships as ESM; the legacy build works without DOM/canvas APIs,
// which is what we need running inside Next.js's Node server runtime.
//
// pdfjs normally spins up its worker via a runtime-computed dynamic
// `import("./pdf.worker.mjs")`. Turbopack/webpack can't resolve that string
// (it resolves relative to the emitted server chunk, not the pdfjs-dist
// package), which surfaces as "Cannot find module ... pdf.worker.mjs". We
// avoid that path entirely by statically importing the worker module and
// registering it as pdfjs' in-process ("fake") worker global — pdfjs checks
// `globalThis.pdfjsWorker` before ever attempting the dynamic import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsPromise: Promise<any> | null = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.mjs"),
    ]).then(([pdfjs, pdfjsWorker]) => {
      (globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = pdfjsWorker;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export interface PdfTextItem {
  text: string;
  /** Bottom-left origin, in PDF points, matching pdf-lib's coordinate system. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPageLayout {
  page: number;
  width: number;
  height: number;
  items: PdfTextItem[];
  hasTextLayer: boolean;
}

export async function extractPdfLayout(buffer: Buffer): Promise<PdfPageLayout[]> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const pages: PdfPageLayout[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items: PdfTextItem[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of textContent.items as any[]) {
      if (typeof item.str !== "string" || item.str.trim() === "") continue;
      const [a, b, c, d, e, f] = item.transform;
      // transform maps to PDF user space already (bottom-left origin).
      const fontHeight = Math.hypot(c, d) || Math.hypot(a, b) || 10;
      items.push({
        text: item.str,
        x: e,
        y: f,
        width: item.width ?? 0,
        height: item.height || fontHeight,
      });
    }

    pages.push({
      page: pageNum,
      width: viewport.width,
      height: viewport.height,
      items,
      hasTextLayer: items.length > 0,
    });
  }

  return pages;
}

/** Flattens page layout into plain text for LLM consumption, page markers included. */
export function layoutToPlainText(pages: PdfPageLayout[]): string {
  return pages
    .map((page) => {
      const lines = groupIntoLines(page.items).map(renderLine);
      return `--- Page ${page.page} ---\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

function renderLine(line: PdfTextItem[]): string {
  return line.map((i) => i.text).join(" ");
}

/** Groups text items into visual lines by y-coordinate proximity, left-to-right. */
export function groupIntoLines(items: PdfTextItem[], tolerance = 3): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfTextItem[][] = [];
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0].y - item.y) <= tolerance);
    if (line) {
      line.push(item);
    } else {
      lines.push([item]);
    }
  }
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
  }
  return lines;
}
