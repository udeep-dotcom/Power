import Link from "next/link";
import { Zap, Trophy, Users, Apple, Dumbbell, Target, ArrowRight, CheckCircle2, Star } from "lucide-react";

const features = [
  { icon: Zap, title: "Streak Engine", desc: "Build daily habits with streaks, badges, and dopamine-driven rewards" },
  { icon: Users, title: "Live Community", desc: "Real-time chat, community feed, group challenges, and social accountability" },
  { icon: Dumbbell, title: "Workout Library", desc: "Expert-curated strength, HIIT, CrossFit, and yoga programs" },
  { icon: Apple, title: "AI Nutritionist", desc: "Personalized diet plans and smart meal coaching powered by AI" },
  { icon: Trophy, title: "Leaderboards", desc: "Weekly rankings, points, and unlockable perks for top performers" },
  { icon: Target, title: "30-Day Challenges", desc: "Transformation challenges that build accountability and lasting habits" },
];

const stats = [
  { value: "10,000+", label: "Active Members" },
  { value: "87%", label: "Retention Rate" },
  { value: "4.9★", label: "Member Rating" },
  { value: "250+", label: "Workout Programs" },
];

const testimonials = [
  { name: "Marcus W.", role: "Elite Member", text: "AFIT Studios changed my relationship with fitness. The streak system keeps me coming back every single day.", level: 18 },
  { name: "Sarah C.", role: "Trainer", text: "As a trainer, I can manage all my clients, post workouts, and watch them grow — all in one beautiful app.", level: 16 },
  { name: "Priya S.", role: "Gold Member", text: "Lost 12kg in 3 months. The AI nutrition coach and community support made all the difference.", level: 10 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">AFIT <span className="text-green-400">Studios</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
            <Link href="/dashboard" className="btn-primary text-sm font-semibold px-4 py-2 rounded-xl text-white">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8 text-sm text-green-400 font-medium">
            <Star className="w-3.5 h-3.5" />
            Premium Fitness Ecosystem
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            Train. Connect.
            <br />
            <span className="text-green-400">Transform.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AFIT Studios combines social accountability, AI coaching, and gamified fitness into one premium platform that makes working out addictive — in the best way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-base">
              Start Your Journey
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/workouts" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-[#2a2a2a] text-gray-300 hover:border-green-500/30 hover:text-white transition-all font-medium text-base">
              Browse Workouts
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-600">Free to start. No credit card required.</p>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6 border-y border-[#1f1f1f]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-green-400 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Everything you need to <span className="text-green-400">stay consistent</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">A complete fitness ecosystem — not just another workout tracker.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="card-hover bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Loved by <span className="text-green-400">real athletes</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} · Lvl {t.level}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to build your
            <br />
            <span className="text-green-400">best physique?</span>
          </h2>
          <p className="text-gray-400 mb-8">Join thousands of members who have transformed their bodies and built lifelong fitness habits.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            {["No contracts", "Cancel anytime", "Instant access"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                {item}
              </div>
            ))}
          </div>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-xl text-white font-bold text-lg">
            Enter AFIT Studios
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] py-8 px-6 text-center text-sm text-gray-600">
        <p>© 2026 AFIT Studios. Built for athletes, by athletes.</p>
      </footer>
    </div>
  );
}
