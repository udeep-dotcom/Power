import { auth } from "@/lib/auth/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new Error("Admin role required");
  }
  return session;
}
