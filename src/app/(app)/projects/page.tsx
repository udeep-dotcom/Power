"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { projects, monthlyGeneration, getProjectStats } from "@/lib/data";
import { formatMWh, formatNPR, getPLFColor, getStatusColor, cn } from "@/lib/utils";
import {
  MapPin, Droplets, Zap, TrendingUp, Calendar, ChevronDown, ChevronUp,
  BarChart3, DollarSign, AlertCircle, CheckCircle2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function ProjectsPage() {
  const [expanded, setExpanded] = useState<string | null>("p1");

  return (
    <div className="min-h-screen">
      <TopBar title="Projects" />
      <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
        <p className="text-sm text-gray-400">
          Managing <span className="text-white font-medium">{projects.length} hydropower projects</span> ·{" "}
          {projects.reduce((s, p) => s + p.installedCapacity, 0).toFixed(1)} MW total installed capacity
        </p>

        {projects.map(proj => {
          const stats = getProjectStats(proj.id);
          const isExpanded = expanded === proj.id;

          // Build 12-month chart data for this project
          const chartData = monthlyGeneration
            .filter(r => r.projectId === proj.id)
            .slice(-12)
            .map(r => ({
              month: r.monthName.slice(0, 3),
              actual: Math.round(r.actualGeneration / 1000 * 10) / 10,
              planned: Math.round(r.plannedGeneration / 1000 * 10) / 10,
              plf: r.plf,
            }));

          return (
            <div key={proj.id} className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : proj.id)}
                className="w-full flex items-center gap-4 p-5 hover:bg-[#162035] transition-colors text-left"
              >
                <div
                  className="w-3 h-12 rounded-full shrink-0"
                  style={{ background: proj.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-white">{proj.name}</h2>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", getStatusColor(proj.status))}>
                      {proj.status === "operational" ? "Operational" : "Under Maintenance"}
                    </span>
                    <span className="text-xs text-gray-500 bg-[#1a2a40] px-2 py-0.5 rounded-full">
                      {proj.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{proj.location}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3" />{proj.river}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />{proj.installedCapacity} MW · {proj.turbines} units
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className={cn("text-lg font-bold", getPLFColor(stats.avgPLF))}>
                      {stats.avgPLF.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Avg PLF 2026</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-lg font-bold text-white">{formatMWh(stats.totalGenYTD)}</p>
                    <p className="text-xs text-gray-500">Generated YTD</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-[#1e3a5f] p-5 space-y-5">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Revenue YTD", value: formatNPR(stats.totalRevYTD),
                        icon: DollarSign, color: "text-green-400 bg-green-500/10"
                      },
                      {
                        label: "Design Flow", value: `${proj.designFlow} m³/s`,
                        icon: Droplets, color: "text-blue-400 bg-blue-500/10"
                      },
                      {
                        label: "Net Head", value: `${proj.headHeight} m`,
                        icon: TrendingUp, color: "text-cyan-400 bg-cyan-500/10"
                      },
                      {
                        label: "NEA Tariff (Wet)", value: `NPR ${proj.neaTariff.wet}/kWh`,
                        icon: BarChart3, color: "text-purple-400 bg-purple-500/10"
                      },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-[#162035] rounded-xl p-3.5 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                          <kpi.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{kpi.label}</p>
                          <p className="text-sm font-semibold text-white">{kpi.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Generation chart */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">
                      Monthly Generation (GWh) · Last 12 months
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                        <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ background: "#0f1929", border: "1px solid #1e3a5f", borderRadius: 8 }}
                          formatter={(v, n) => [`${v} GWh`, n === "actual" ? "Actual" : "Planned"] as [string, string]}
                        />
                        <Line
                          type="monotone" dataKey="planned"
                          stroke="#1e3a5f" strokeDasharray="4 4" strokeWidth={1.5} dot={false}
                          name="planned"
                        />
                        <Line
                          type="monotone" dataKey="actual"
                          stroke={proj.color} strokeWidth={2} dot={{ r: 3, fill: proj.color }}
                          name="actual"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* License & tariff info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1e3a5f]">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Commission Date
                      </p>
                      <p className="text-sm text-white">{proj.commissionDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> License Expiry
                      </p>
                      <p className="text-sm text-white">{proj.licenseExpiry}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Operator</p>
                      <p className="text-sm text-white">{proj.operator}</p>
                    </div>
                  </div>

                  {/* NEA Tariff */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Wet Season Tariff</p>
                      <p className="text-xl font-bold text-blue-400">NPR {proj.neaTariff.wet}</p>
                      <p className="text-xs text-gray-600">per kWh · Jun–Nov</p>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Dry Season Tariff</p>
                      <p className="text-xl font-bold text-amber-400">NPR {proj.neaTariff.dry}</p>
                      <p className="text-xs text-gray-600">per kWh · Dec–May</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
