"use server";

import { signIn } from "@/lib/auth/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/dashboard",
    });
    return { error: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw err;
  }
}
