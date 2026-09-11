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

    const { text, fontSize } = fitTextToWidth(field.value, field.width, field.fontSize, font);
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
