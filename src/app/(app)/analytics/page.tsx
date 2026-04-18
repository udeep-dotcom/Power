"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { projects, monthlyGeneration } from "@/lib/data";
import { getPLFColor, cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
} from "recharts";

const COLORS: Record<string, string> = {
  p1: "#3b82f6",
  p2: "#06b6d4",
  p3: "#8b5cf6",
  p4: "#f59e0b",
};

type MetricKey = "generation" | "plf" | "revenue" | "spill";

export default function AnalyticsPage() {
  const [metric, setMetric] = useState<MetricKey>("generation");
  const [selectedProject, setSelectedProject] = useState("all");

  // Build 24-month data grouped by month
  const timelineData = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(2024, 3 + i); // Start April 2024
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const label = d.toLocaleString("default", { month: "short" }) + " " + String(year).slice(2);

    const records = monthlyGeneration.filter(
      r => r.year === year && r.month === month &&
        (selectedProject === "all" || r.projectId === selectedProject)
    );

    return {
      label,
      generation: Math.round(records.reduce((s, r) => s + r.actualGeneration, 0) / 1000),
      planned: Math.round(records.reduce((s, r) => s + r.plannedGeneration, 0) / 1000),
      plf: records.length ? records.reduce((s, r) => s + r.plf, 0) / records.length : 0,
      revenue: Math.round(records.reduce((s, r) => s + r.revenue, 0) / 1_000_000),
      spill: records.reduce((s, r) => s + r.spillHours, 0),
    };
  });

  // Wet vs dry season comparison
  const wetData = monthlyGeneration.filter(r => r.isWetSeason &&
    (selectedProject === "all" || r.projectId === selectedProject));
  const dryData = monthlyGeneration.filter(r => !r.isWetSeason &&
    (selectedProject === "all" || r.projectId === selectedProject));

  const avgWetGen = wetData.length ? wetData.reduce((s, r) => s + r.actualGeneration, 0) / wetData.length : 0;
  const avgDryGen = dryData.length ? dryData.reduce((s, r) => s + r.actualGeneration, 0) / dryData.length : 0;
  const avgWetPLF = wetData.length ? wetData.reduce((s, r) => s + r.plf, 0) / wetData.length : 0;
  const avgDryPLF = dryData.length ? dryData.reduce((s, r) => s + r.plf, 0) / dryData.length : 0;

  // Month-by-month seasonal radar (average for each month across all years)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const radarData = monthNames.map((name, idx) => {
    const recs = monthlyGeneration.filter(r => r.month === idx + 1 &&
      (selectedProject === "all" || r.projectId === selectedProject));
    return {
      month: name,
      avgPLF: recs.length ? Math.round(recs.reduce((s, r) => s + r.plf, 0) / recs.length) : 0,
    };
  });

  // Per-project PLF comparison for YTD 2026
  const projectPLF = projects.map(p => {
    const recs = monthlyGeneration.filter(r => r.projectId === p.id && r.year === 2026);
    return {
      name: p.name.split(" ").slice(0, 2).join(" "),
      plf: recs.length ? Math.round(recs.reduce((s, r) => s + r.plf, 0) / recs.length * 10) / 10 : 0,
      color: p.color,
    };
  });

  const metricConfig: Record<MetricKey, { label: string; unit: string; color: string; key: string }> = {
    generation: { label: "Generation", unit: "GWh", color: "#3b82f6", key: "generation" },
    plf: { label: "Plant Load Factor", unit: "%", color: "#8b5cf6", key: "plf" },
    revenue: { label: "Revenue", unit: "M NPR", color: "#22c55e", key: "revenue" },
    spill: { label: "Spill Hours", unit: "hrs", color: "#f59e0b", key: "spill" },
  };

  const mc = metricConfig[metric];

  return (
    <div className="min-h-screen">
      <TopBar title="Analytics" />
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-[#0f1929] border border-[#1e3a5f] rounded-xl overflow-hidden">
            {(Object.keys(metricConfig) as MetricKey[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  "px-3 py-2 text-xs font-medium capitalize transition-colors whitespace-nowrap",
                  metric === m
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {metricConfig[m].label}
              </button>
            ))}
          </div>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="bg-[#0f1929] border border-[#1e3a5f] text-sm text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500/50"
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Main timeline chart */}
        <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-white">
              {mc.label} Trend · Apr 2024 – Mar 2026
            </h2>
            <p className="text-xs text-gray-500">24-month view · {mc.unit}</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={timelineData}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mc.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={mc.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} interval={1} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#0f1929", border: "1px solid #1e3a5f", borderRadius: 8 }}
                formatter={(v) => [`${v} ${mc.unit}`, mc.label] as [string, string]}
              />
              {metric === "generation" && (
                <Line
                  type="monotone" dataKey="planned"
                  stroke="#1e3a5f" strokeDasharray="4 4" strokeWidth={1.5} dot={false}
                  name="Planned"
                />
              )}
              <Area
                type="monotone" dataKey={mc.key}
                stroke={mc.color} fill="url(#metricGrad)"
                strokeWidth={2} dot={false}
                name={mc.label}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Seasonal comparison + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Wet vs Dry */}
          <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-1">Wet vs Dry Season</h2>
            <p className="text-xs text-gray-500 mb-4">Average monthly performance</p>
            <div className="space-y-4">
              {[
                {
                  label: "Avg. Monthly Generation",
                  wet: Math.round(avgWetGen / 1000 * 10) / 10,
                  dry: Math.round(avgDryGen / 1000 * 10) / 10,
                  unit: "GWh",
                },
                {
                  label: "Avg. Plant Load Factor",
                  wet: Math.round(avgWetPLF * 10) / 10,
                  dry: Math.round(avgDryPLF * 10) / 10,
                  unit: "%",
                },
              ].map(item => {
                const total = item.wet + item.dry;
                return (
                  <div key={item.label}>
                    <p className="text-xs text-gray-500 mb-2">{item.label}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-blue-400 w-16 text-right font-medium">
                        {item.wet}{item.unit}
                      </span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-blue-500 rounded-l-full transition-all"
                          style={{ width: `${(item.wet / total) * 100}%` }}
                        />
                        <div
                          className="h-full bg-amber-500 rounded-r-full transition-all"
                          style={{ width: `${(item.dry / total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-amber-400 w-16 font-medium">
                        {item.dry}{item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1 px-16">
                      <span>Wet (Jun–Nov)</span>
                      <span>Dry (Dec–May)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Seasonal monthly avg chart */}
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={radarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#0f1929", border: "1px solid #1e3a5f", borderRadius: 8 }}
                    formatter={(v) => [`${v}%`, "Avg PLF"] as [string, string]}
                  />
                  <Bar
                    dataKey="avgPLF"
                    radius={[3, 3, 0, 0]}
                    name="Avg PLF"
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plant PLF comparison */}
          <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-1">Plant PLF Comparison</h2>
            <p className="text-xs text-gray-500 mb-4">YTD 2026 average plant load factor</p>
            <div className="space-y-4">
              {projectPLF.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm text-gray-300">{p.name}</p>
                    <p className={cn("text-sm font-bold", getPLFColor(p.plf))}>{p.plf}%</p>
                  </div>
                  <div className="h-2.5 bg-[#1e3a5f] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full progress-fill"
                      style={{ width: `${p.plf}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-[#1e3a5f]">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {Math.round(avgWetPLF * 10) / 10}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg Wet Season PLF</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {Math.round(avgDryPLF * 10) / 10}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg Dry Season PLF</p>
              </div>
            </div>
          </div>
        </div>

        {/* Year-over-year */}
        <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-1">Year-over-Year Generation by Month</h2>
          <p className="text-xs text-gray-500 mb-4">2025 vs 2026 comparison (GWh)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={monthNames.map((name, idx) => {
                const m = idx + 1;
                const recs2025 = monthlyGeneration.filter(r => r.month === m && r.year === 2025 &&
                  (selectedProject === "all" || r.projectId === selectedProject));
                const recs2026 = monthlyGeneration.filter(r => r.month === m && r.year === 2026 &&
                  (selectedProject === "all" || r.projectId === selectedProject));
                return {
                  month: name,
                  "2025": Math.round(recs2025.reduce((s, r) => s + r.actualGeneration, 0) / 1000 * 10) / 10,
                  "2026": Math.round(recs2026.reduce((s, r) => s + r.actualGeneration, 0) / 1000 * 10) / 10,
                };
              })}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#0f1929", border: "1px solid #1e3a5f", borderRadius: 8 }}
                formatter={(v) => [`${v} GWh`] as [string]}
              />
              <Legend />
              <Bar dataKey="2025" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
              <Bar dataKey="2026" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
