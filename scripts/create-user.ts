/**
 * Creates (or resets the password for) a single named user with a
 * securely generated password, printed once to stdout — never stored in
 * plaintext anywhere. For onboarding a small, known set of testers
 * (Section 22: ADMIN/OPERATOR roles).
 *
 * Usage:
 *   npx tsx scripts/create-user.ts <email> <name> [ADMIN|OPERATOR]
 *
 * Example:
 *   npx tsx scripts/create-user.ts jane@company.com "Jane Doe" OPERATOR
 */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function generatePassword(): string {
  // 18 random bytes -> 24-char base64url string. Plenty of entropy, easy to type/paste.
  return randomBytes(18).toString("base64url");
}

async function main() {
  const [email, name, roleArg] = process.argv.slice(2);
  if (!email || !name) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <name> [ADMIN|OPERATOR]");
    process.exit(1);
  }

  const role: UserRole = roleArg === "ADMIN" ? "ADMIN" : "OPERATOR";
  const normalizedEmail = email.toLowerCase().trim();

  // Reuse the default seeded org if present; otherwise the caller should run
  // `npm run db:seed` first, or pass an org via SEED_ORGANIZATION_ID.
  const organizationId = process.env.SEED_ORGANIZATION_ID ?? "seed-default-org";
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    console.error(
      `Organization "${organizationId}" not found. Run "npm run db:seed" first, or set SEED_ORGANIZATION_ID.`,
    );
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { passwordHash, name, role },
    create: { email: normalizedEmail, name, role, passwordHash, organizationId: org.id },
  });

  console.log(`User ready: ${user.email} (${user.role}) in "${org.name}"`);
  console.log(`Temporary password: ${password}`);
  console.log(
    "Send this to the user over a secure channel. Note: there is no self-serve password-change " +
      "screen yet (Phase 2) — to rotate a password later, re-run this script for the same email.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
