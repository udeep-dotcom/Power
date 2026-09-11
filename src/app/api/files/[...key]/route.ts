import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { getStorageDriver } from "@/lib/storage";

/**
 * Authenticated file streaming for local storage (Section 21: expiring
 * document URLs). Every request re-checks that the storage key belongs to a
 * transaction in the caller's organization — the key itself grants no
 * access on its own.
 */
export async function GET(_req: Request, context: { params: Promise<{ key: string[] }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await context.params;
  const storageKey = key.join("/");

  const [document, generated] = await Promise.all([
    prisma.document.findFirst({
      where: { storageKey, transaction: { organizationId: session.user.organizationId } },
    }),
    prisma.generatedDocument.findFirst({
      where: { storageKey, transaction: { organizationId: session.user.organizationId } },
    }),
  ]);

  if (!document && !generated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storage = getStorageDriver();
  const buffer = await storage.get(storageKey);
  const mimeType: string = document ? document.mimeType : "application/pdf";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${storageKey.split("/").pop()}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
