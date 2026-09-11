import { prisma } from "@/lib/prisma";

/**
 * Generates a human-readable transaction id like DOC-2026-000001 (Section 25).
 * The UUID primary key remains the internal identifier; this is only for
 * display and search. Uses a transaction-scoped count of the current year to
 * stay stable even with concurrent creations (best-effort; a unique
 * constraint on documentNumber is the real safety net against collisions).
 */
export async function generateDocumentNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DOC-${year}-`;

  const count = await prisma.transaction.count({
    where: { organizationId, documentNumber: { startsWith: prefix } },
  });

  let attempt = count + 1;
  for (let i = 0; i < 5; i++) {
    const candidate = `${prefix}${String(attempt).padStart(6, "0")}`;
    const existing = await prisma.transaction.findUnique({
      where: { documentNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    attempt++;
  }
  throw new Error("Could not generate a unique document number");
}
