import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageDriver } from "./index";

const PRESIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes

/**
 * S3-compatible storage for production (Section 26). Works against AWS S3,
 * Cloudflare R2, Supabase Storage, MinIO, or any other S3-API-compatible
 * provider — set S3_ENDPOINT for anything that isn't AWS itself. Required
 * for any serverless/stateless deployment target (e.g. Vercel): those have
 * no persistent local disk between requests, so LocalStorageDriver silently
 * loses files there.
 *
 * Unlike the local driver's non-expiring authenticated route, this actually
 * satisfies Section 21's "expiring document URLs" — getUrl returns a
 * presigned GetObject URL valid for 15 minutes.
 */
export class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    if (!bucket) throw new Error("S3_BUCKET is required when STORAGE_DRIVER=s3");
    if (!region) throw new Error("S3_REGION is required when STORAGE_DRIVER=s3");

    this.bucket = bucket;
    this.client = new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT || undefined,
      // R2/MinIO/most non-AWS S3-compatible providers need path-style
      // addressing (bucket.example.com/key doesn't resolve for them).
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined, // falls back to the SDK's default credential chain (e.g. IAM role)
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
    return key;
  }

  async get(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Object not found or empty: ${key}`);
    return Buffer.from(bytes);
  }

  async getUrl(key: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
