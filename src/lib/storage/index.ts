import { randomUUID } from "crypto";
import { LocalStorageDriver } from "./local";
import { S3StorageDriver } from "./s3";

/**
 * Storage abstraction (Section 26). Development uses local disk;
 * production should configure STORAGE_DRIVER=s3 against S3, Cloudflare R2,
 * Supabase Storage, or any S3-compatible provider without app code changes.
 */
export interface StorageDriver {
  /** Store a file and return its storage key. */
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  /** A URL the browser can fetch to download/view the file. Should expire in production. */
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

/**
 * The extension is later echoed back into a Content-Disposition response
 * header (src/app/api/files/[...key]/route.ts) unescaped, so it's allow-
 * listed to plain alphanumerics rather than trusting the client-supplied
 * filename verbatim — an untrusted filename containing quotes/semicolons
 * could otherwise inject extra header parameters.
 */
function sanitizeExtension(raw: string | undefined): string {
  const cleaned = (raw ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  return cleaned || "bin";
}

export function buildStorageKey(prefix: string, originalName: string): string {
  const ext = sanitizeExtension(originalName.includes(".") ? originalName.split(".").pop() : undefined);
  return `${prefix}/${randomUUID()}.${ext}`;
}

let driver: StorageDriver | null = null;

export function getStorageDriver(): StorageDriver {
  if (driver) return driver;

  const kind = process.env.STORAGE_DRIVER ?? "local";
  if (kind === "s3") {
    driver = new S3StorageDriver();
    return driver;
  }

  driver = new LocalStorageDriver(process.env.LOCAL_STORAGE_DIR ?? "./storage");
  return driver;
}
