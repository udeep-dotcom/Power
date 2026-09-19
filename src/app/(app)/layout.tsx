import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-slate-900">
              FormFill
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-600 sm:gap-6">
              <Link href="/dashboard" className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/transactions" className="hover:text-slate-900">
                History
              </Link>
              <Link href="/transactions/new" className="hover:text-slate-900">
                + Create Filled Form
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">
              {session.user.name} <span className="text-slate-400">({session.user.role})</span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
