import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  transactionId?: string;
  userId?: string;
  action: string;
  detail?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      transactionId: params.transactionId,
      userId: params.userId,
      action: params.action,
      detail: params.detail,
    },
  });
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
