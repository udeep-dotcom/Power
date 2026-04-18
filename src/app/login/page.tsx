"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Droplets, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("admin@nephydro.com.np");
  const [password, setPassword] = useState("hydrotrack123");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl">
            Hydro<span className="gradient-text">Track</span>
            <span className="text-xs text-gray-500 ml-1 font-normal">Nepal</span>
          </span>
        </div>

        <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-1">Sign in to your account</h1>
          <p className="text-sm text-gray-400 mb-6">
            Nepal Hydropower Reporting Platform
          </p>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {searchParams.get("error") === "CredentialsSignin" && !error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Invalid credentials. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#162035] border border-[#1e3a5f] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50 transition-colors"
                placeholder="you@company.com.np"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50 transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1e3a5f] text-center">
            <p className="text-xs text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300">
                Register your company
              </Link>
            </p>
          </div>

          {/* Dev hint */}
          <div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3 text-xs text-gray-500">
            <span className="text-blue-400 font-medium">Demo:</span> Run{" "}
            <code className="text-cyan-400">npm run db:seed</code> then use{" "}
            <code className="text-cyan-400">admin@nephydro.com.np</code> /
            <code className="text-cyan-400"> hydrotrack123</code>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5">
          <Link href="/" className="hover:text-gray-400">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
