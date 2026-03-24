"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, CheckCircle2 } from "lucide-react";

const goals = [
  { id: "fat_loss", label: "Fat Loss", icon: "🔥" },
  { id: "muscle_gain", label: "Muscle Gain", icon: "💪" },
  { id: "endurance", label: "Endurance", icon: "⚡" },
  { id: "flexibility", label: "Flexibility", icon: "🧘" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    goal: "muscle_gain", weight: "", height: "",
  });

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => router.push("/dashboard"), 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-2xl">AFIT <span className="text-green-400">Studios</span></span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  s < step ? "bg-green-500 border-green-500 text-white" :
                  s === step ? "border-green-500 text-green-400" :
                  "border-[#2a2a2a] text-gray-600"
                }`}>
                  {s < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-green-500" : "bg-[#2a2a2a]"}`} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Step {step} of 3</p>
        </div>

        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">Create your account</h2>
                <p className="text-sm text-gray-400">Start your fitness journey today</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                  placeholder="you@afits.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                  placeholder="••••••••"
                />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">Your fitness goal</h2>
                <p className="text-sm text-gray-400">We&apos;ll personalize your experience</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setForm({ ...form, goal: g.id })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.goal === g.id
                        ? "border-green-500 bg-green-500/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <div className="text-2xl mb-1">{g.icon}</div>
                    <div className="text-sm font-semibold">{g.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                    placeholder="75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50"
                    placeholder="175"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-[#2a2a2a] text-gray-400 font-medium hover:border-[#3a3a3a] transition-colors">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3 rounded-xl font-semibold text-white">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-black">You&apos;re all set!</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your AFIT Studios account is ready. Let&apos;s start building your streak and transforming your fitness journey.
              </p>
              <div className="bg-[#1a1a1a] rounded-xl p-4 text-left space-y-2">
                {[
                  "Personalized workout plan created",
                  "AI nutrition coach activated",
                  "Community profile set up",
                  "First streak day started!",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-primary w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Enter AFIT Studios <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
