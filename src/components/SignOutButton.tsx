"use client";

import { signOutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
        Sign out
      </button>
    </form>
  );
}
