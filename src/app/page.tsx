import Link from "next/link";
import { Droplets, Zap, TrendingUp, FileUp, BarChart3, Bell, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Generation Monitoring",
    desc: "Track daily, monthly, and annual generation for all your hydropower projects in one unified dashboard.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics & Trends",
    desc: "Visualize PLF trends, seasonal patterns, planned vs actual comparisons, and revenue forecasts.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: FileUp,
    title: "Excel / CSV Data Import",
    desc: "Import years of historical generation data from Excel or CSV files. Supports NEA standard formats.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    desc: "Get notified of underperformance, grid outages, equipment failures, and compliance deadlines instantly.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Shield,
    title: "NEA Compliance Reports",
    desc: "Generate monthly NEA-compliant generation reports, revenue statements, and audit-ready exports.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Globe,
    title: "Multi-Project Portfolio",
    desc: "Manage multiple hydropower plants across Nepal with role-based access for engineers and executives.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
];

const stats = [
  { value: "271+ MW", label: "Portfolio Capacity Managed" },
  { value: "98.2%", label: "Data Accuracy" },
  { value: "NPR 2.4B+", label: "Revenue Tracked" },
  { value: "4 Plants", label: "Active Projects" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Nav */}
      <nav className="border-b border-[#1e3a5f] px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">
            Hydro<span className="gradient-text">Track</span>
            <span className="text-xs text-gray-500 ml-1 font-normal">Nepal</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
            Sign In
          </Link>
          <Link href="/dashboard" className="btn-primary text-sm font-semibold px-4 py-2 rounded-lg text-white">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-5xl mx-auto animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
          <Zap className="w-3.5 h-3.5" />
          Built for Nepal&apos;s Independent Power Producers
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
          Smarter Reporting for{" "}
          <span className="gradient-text">Nepal&apos;s Hydropower</span>{" "}
          Sector
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          HydroTrack replaces spreadsheets and manual registers with a powerful reporting platform —
          giving project owners real-time visibility into generation, revenue, and plant performance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-white text-base inline-flex items-center gap-2 justify-center">
            <Droplets className="w-4 h-4" />
            View Live Dashboard
          </Link>
          <Link href="/import" className="btn-secondary px-8 py-3.5 rounded-xl font-semibold text-blue-400 text-base inline-flex items-center gap-2 justify-center">
            <FileUp className="w-4 h-4" />
            Import Your Data
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-card text-center">
              <p className="text-2xl lg:text-3xl font-bold gradient-text">{s.value}</p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything a Plant Owner Needs</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From daily generation logs to NEA compliance reports — HydroTrack covers the full reporting lifecycle.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card-hover p-6 rounded-2xl border bg-[#0f1929] border-[#1e3a5f]">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${f.bg}`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to modernize your reporting?</h2>
          <p className="text-gray-400 mb-8">
            Import your existing Excel data in minutes and see your entire portfolio at a glance.
          </p>
          <Link href="/dashboard" className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-white inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Start Now — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e3a5f] px-6 py-6 text-center text-sm text-gray-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Droplets className="w-4 h-4 text-blue-800" />
          <span className="font-medium text-gray-500">HydroTrack Nepal</span>
        </div>
        <p>Built for Independent Power Producers of Nepal · NEA compliant reporting</p>
      </footer>
    </div>
  );
}
