import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const orgName = process.env.SEED_ORG_NAME ?? "Demo Company";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const org = await prisma.organization.upsert({
    where: { id: "seed-default-org" },
    update: {},
    create: { id: "seed-default-org", name: orgName },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrator",
      passwordHash,
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  console.log(`Seeded organization "${org.name}" and admin user ${admin.email}.`);
  console.log(
    adminPassword === "ChangeMe123!"
      ? "Using the default password ChangeMe123! — set SEED_ADMIN_PASSWORD before seeding a real environment."
      : "Admin password set from SEED_ADMIN_PASSWORD.",
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
