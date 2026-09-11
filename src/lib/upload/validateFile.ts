/**
 * Upload validation (Section 21). Checks both the declared MIME type and the
 * file's actual magic bytes so a renamed .exe can't slip through as a PDF.
 */

export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

const MAGIC_BYTES: Record<AcceptedMimeType, Buffer[]> = {
  "application/pdf": [Buffer.from("%PDF")],
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
};

export interface FileValidationResult {
  ok: boolean;
  detectedType?: AcceptedMimeType;
  error?: string;
}

export function validateUploadedFile(
  declaredMimeType: string,
  buffer: Buffer,
  maxSizeBytes: number,
): FileValidationResult {
  if (buffer.length === 0) {
    return { ok: false, error: "File is empty" };
  }
  if (buffer.length > maxSizeBytes) {
    return { ok: false, error: `File exceeds maximum size of ${Math.round(maxSizeBytes / 1024 / 1024)}MB` };
  }

  const detectedType = ACCEPTED_MIME_TYPES.find((type) =>
    MAGIC_BYTES[type].some((magic) => buffer.subarray(0, magic.length).equals(magic)),
  );

  if (!detectedType) {
    return {
      ok: false,
      error: "Unsupported or unrecognized file type. Accepted: PDF, JPG, PNG.",
    };
  }

  if (declaredMimeType && !declaredMimeType.includes(detectedType.split("/")[1])) {
    // Declared type disagrees with actual content — reject rather than trust the client.
    return { ok: false, error: "File content does not match its declared type" };
  }

  return { ok: true, detectedType };
}

export function maxUploadSizeBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "20");
  return mb * 1024 * 1024;
}
