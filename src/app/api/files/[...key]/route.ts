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
      include: { transaction: { select: { documentNumber: true } } },
    }),
  ]);

  if (!document && !generated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storage = getStorageDriver();
  const buffer = await storage.get(storageKey);
  const mimeType: string = document ? document.mimeType : "application/pdf";
  const displayName = document ? document.originalName : `${generated!.transaction.documentNumber}-filled.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": buildContentDisposition(displayName),
      "Cache-Control": "private, no-store",
    },
  });
}

/**
 * Builds a safe Content-Disposition header value from a filename that may
 * contain arbitrary user-supplied characters (quotes, semicolons, non-ASCII).
 * The ASCII fallback is stripped to a safe subset for the quoted `filename`
 * parameter; the RFC 5987 `filename*` parameter carries the full name for
 * clients that support it.
 */
function buildContentDisposition(rawName: string): string {
  const asciiFallback = rawName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "download";
  const encoded = encodeURIComponent(rawName);
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
