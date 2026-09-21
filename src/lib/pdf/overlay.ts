import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface OverlayField {
  page: number; // 1-indexed, matches extractPdfLayout
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  value: string;
  dataType: "TEXT" | "DATE" | "CURRENCY" | "NUMBER" | "ACCOUNT" | "SWIFT" | "CHECKBOX";
}

const MIN_FONT_SIZE = 6;

/** CP1252 places these in 0x80–0x9F, where Latin-1 has control codes. */
const CP1252_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

/**
 * Makes a value safe for the standard PDF font, which encodes WinAnsi only.
 *
 * Extracted values are whatever the document happened to contain. A party name
 * read across two lines arrives with a newline in it, and pdf-lib throws
 * outright on any character it cannot encode — so one multi-line address, or a
 * single Devanagari character on a Nepali document, failed the entire form
 * generation rather than that one field.
 *
 * Line breaks become spaces (a form box is a single line anyway) and anything
 * still unencodable is dropped, so an awkward character costs a character
 * rather than the whole document.
 */
export function sanitizeForPdfText(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  let out = "";
  for (const char of collapsed) {
    const code = char.codePointAt(0)!;
    if (code >= 0x20 && code <= 0x7e) out += char;
    else if (code >= 0xa0 && code <= 0xff) out += char;
    else if (CP1252_EXTRAS.has(code)) out += char;
  }
  return out;
}

/**
 * Overlays mapped values onto the original form at their detected
 * coordinates (Section 13, Case B). The original PDF bytes are untouched
 * apart from the added text — page size, logos, boxes, and layout are
 * preserved exactly, per Section 3.
 */
export async function overlayValuesOnPdf(originalPdf: Buffer, fields: OverlayField[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(originalPdf);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const field of fields) {
    const page = pages[field.page - 1];
    if (!page) continue;

    if (field.dataType === "CHECKBOX") {
      if (isTruthyCheckbox(field.value)) {
        page.drawText("X", {
          x: field.x + 2,
          y: field.y,
          size: Math.min(field.fontSize, field.height || 10),
          font,
          color: rgb(0, 0, 0),
        });
      }
      continue;
    }

    const safeValue = sanitizeForPdfText(field.value);
    if (safeValue === "") continue;

    const { text, fontSize } = fitTextToWidth(safeValue, field.width, field.fontSize, font);
    page.drawText(text, {
      x: field.x,
      y: field.y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0.05),
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

function isTruthyCheckbox(value: string): boolean {
  return ["true", "yes", "1", "x", "checked"].includes(value.trim().toLowerCase());
}

/**
 * Field overflow handling (Section 38): shrink the font within a configured
 * floor before falling back to truncation with an ellipsis. Never draws
 * outside the field's own width, so text can't bleed into a neighboring box.
 */
function fitTextToWidth(
  text: string,
  maxWidth: number,
  startingFontSize: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
): { text: string; fontSize: number } {
  let fontSize = startingFontSize;
  while (fontSize > MIN_FONT_SIZE) {
    const width = font.widthOfTextAtSize(text, fontSize);
    if (width <= maxWidth) return { text, fontSize };
    fontSize -= 0.5;
  }

  fontSize = MIN_FONT_SIZE;
  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}…`, fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return { text: truncated.length < text.length ? `${truncated}…` : truncated, fontSize };
}
