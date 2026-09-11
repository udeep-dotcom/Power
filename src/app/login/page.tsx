import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">FormFill</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
      </div>
    </div>
  );
}
