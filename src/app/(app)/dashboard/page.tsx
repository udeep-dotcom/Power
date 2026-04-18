"use client";
import TopBar from "@/components/layout/TopBar";
import { projects, alerts, monthlyGeneration, dailyGeneration, getPortfolioSummary } from "@/lib/data";
import { formatMWh, formatNPR, getPLFColor, getStatusColor, cn } from "@/lib/utils";
import {
  Zap, TrendingUp, TrendingDown, AlertTriangle, Droplets,
  Activity, DollarSign, BarChart3, ArrowRight, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && (
          <p className={cn("text-xs mt-0.5 flex items-center gap-1",
            trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-gray-500"
          )}>
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

const COLORS: Record<string, string> = {
  p1: "#3b82f6",
  p2: "#06b6d4",
  p3: "#8b5cf6",
  p4: "#f59e0b",
};

export default function DashboardPage() {
  const summary = getPortfolioSummary();

  // Last 12 months chart data (all projects combined)
  const last12 = monthlyGeneration
    .filter(r => {
      const d = new Date(r.year, r.month - 1);
      const cutoff = new Date(2026, 3); // April 2026
      const start = new Date(2025, 3);  // April 2025
      return d >= start && d < cutoff;
    })
    .reduce((acc: Record<string, { month: string; actual: number; planned: number }>, r) => {
      const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = { month: r.monthName + " " + r.year.toString().slice(2), actual: 0, planned: 0 };
      acc[key].actual += r.actualGeneration;
      acc[key].planned += r.plannedGeneration;
      return acc;
    }, {});

  const chartData = Object.values(last12).map(d => ({
    ...d,
    actual: Math.round(d.actual / 1000),   // GWh
    planned: Math.round(d.planned / 1000), // GWh
  }));

  // Today's generation by project (April 18 data)
  const todayByProject = projects.map(p => {
    const today = dailyGeneration.find(d => d.projectId === p.id && d.day === 18);
    return {
      name: p.name.split(" ").slice(0, 2).join(" "),
      actual: today ? Math.round(today.actualGeneration) : 0,
      capacity: Math.round(p.installedCapacity * 24),
    };
  });

  const activeAlerts = alerts.filter(a => !a.resolved).slice(0, 4);
  const criticalCount = alerts.filter(a => !a.resolved && a.severity === "critical").length;

  return (
    <div className="min-h-screen">
      <TopBar title="Portfolio Dashboard" />

      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Critical alert banner */}
        {criticalCount > 0 && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              <span className="font-semibold">{criticalCount} critical alert{criticalCount > 1 ? "s" : ""}</span>
              {" "}require immediate attention.
            </p>
            <Link href="/alerts" className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Portfolio KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Installed Capacity"
            value={`${summary.totalCapacity.toFixed(1)} MW`}
            sub={`${projects.filter(p => p.status === "operational").length}/${projects.length} plants online`}
            icon={Zap}
            color="bg-blue-500/10 border border-blue-500/20 text-blue-400"
            trend="neutral"
          />
          <StatCard
            label="Generation YTD 2026"
            value={formatMWh(summary.totalGenYTD)}
            sub="+4.2% vs same period 2025"
            icon={Activity}
            color="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
            trend="up"
          />
          <StatCard
            label="Revenue YTD 2026"
            value={formatNPR(summary.totalRevYTD)}
            sub="Across all projects"
            icon={DollarSign}
            color="bg-green-500/10 border border-green-500/20 text-green-400"
            trend="up"
          />
          <StatCard
            label="Avg. Plant Load Factor"
            value={`${summary.avgPLF.toFixed(1)}%`}
            sub="Jan–Apr 2026 average"
            icon={BarChart3}
            color="bg-purple-500/10 border border-purple-500/20 text-purple-400"
            trend="neutral"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 12-month generation chart */}
          <div className="lg:col-span-2 bg-[#0f1929] border border-[#1e3a5f] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white">Portfolio Generation</h2>
                <p className="text-xs text-gray-500">Last 12 months (GWh) · Actual vs Planned</p>
              </div>
              <Link href="/analytics" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Full analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0f1929", border: "1px solid #1e3a5f", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v, n) => [`${v} GWh`, n === "actual" ? "Actual" : "Planned"] as [string, string]}
                />
                <Legend formatter={(v) => v === "actual" ? "Actual" : "Planned"} />
                <Area type="monotone" dataKey="planned" stroke="#1e3a5f" strokeDasharray="4 4" fill="none" strokeWidth={1.5} />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="url(#colActual)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Today's generation by plant */}
          <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white">Today — Apr 18</h2>
                <p className="text-xs text-gray-500">MWh generated per plant</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={todayByProject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ background: "#0f1929", border: "1px solid #1e3a5f", borderRadius: 8 }}
                  formatter={(v) => [`${v} MWh`] as [string]}
                />
                <Bar dataKey="capacity" fill="#1e3a5f" name="Capacity" radius={[0, 4, 4, 0]} />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects + Alerts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Project status cards */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Projects</h2>
              <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                All projects <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {projects.map(p => {
              const lastMonthData = monthlyGeneration
                .filter(r => r.projectId === p.id)
                .slice(-1)[0];
              const achievementPct = lastMonthData
                ? Math.round((lastMonthData.actualGeneration / lastMonthData.plannedGeneration) * 100)
                : 0;
              return (
                <Link
                  key={p.id}
                  href={`/projects?id=${p.id}`}
                  className="card-hover flex items-center gap-4 bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-4"
                >
                  <div
                    className="w-2 h-10 rounded-full shrink-0"
                    style={{ background: COLORS[p.id] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white text-sm truncate">{p.name}</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", getStatusColor(p.status))}>
                        {p.status === "operational" ? "Operational" : "Maintenance"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{p.location} · {p.river} · {p.installedCapacity} MW</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full progress-fill"
                          style={{
                            width: `${Math.min(achievementPct, 100)}%`,
                            background: COLORS[p.id],
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{achievementPct}% of plan</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold", getPLFColor(lastMonthData?.plf ?? 0))}>
                      {lastMonthData?.plf.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">PLF</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Active alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Active Alerts</h2>
              <Link href="/alerts" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {activeAlerts.map(a => {
              const proj = projects.find(p => p.id === a.projectId);
              const colors: Record<string, string> = {
                critical: "border-l-red-500 bg-red-500/5",
                warning: "border-l-amber-500 bg-amber-500/5",
                info: "border-l-blue-500 bg-blue-500/5",
              };
              const iconColors: Record<string, string> = {
                critical: "text-red-400",
                warning: "text-amber-400",
                info: "text-blue-400",
              };
              return (
                <div
                  key={a.id}
                  className={cn("border border-[#1e3a5f] border-l-4 rounded-xl p-3.5", colors[a.severity])}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", iconColors[a.severity])} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white leading-tight">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{proj?.name}</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{a.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <Link
              href="/generation"
              className="w-full flex items-center gap-3 bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-4 hover:border-blue-500/30 transition-colors"
            >
              <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Log Today&apos;s Generation</p>
                <p className="text-xs text-gray-500">Enter daily data for all plants</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
