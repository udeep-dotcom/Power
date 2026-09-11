import { promises as fs } from "fs";
import path from "path";
import type { StorageDriver } from "./index";

/**
 * Local-disk storage for development. Files live outside the web root; the
 * only way to read them back is through the authenticated /api/files/[key]
 * route, which re-checks that the caller's organization owns the underlying
 * transaction before streaming bytes.
 */
export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly rootDir: string) {}

  private resolve(key: string): string {
    const resolved = path.resolve(this.rootDir, key);
    const root = path.resolve(this.rootDir);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }

  async put(key: string, data: Buffer): Promise<string> {
    const filePath = this.resolve(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async getUrl(key: string): Promise<string> {
    return `/api/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }
}
