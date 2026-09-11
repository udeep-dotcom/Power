// pdfjs-dist ships as ESM; the legacy build works without DOM/canvas APIs,
// which is what we need running inside Next.js's Node server runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsPromise: Promise<any> | null = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
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
      const lineGroups = groupIntoLines(page.items);
      const lines = lineGroups.map((line) => line.map((i) => i.text).join(" "));
      return `--- Page ${page.page} ---\n${lines.join("\n")}`;
    })
    .join("\n\n");
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
