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

export function buildStorageKey(prefix: string, originalName: string): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
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
