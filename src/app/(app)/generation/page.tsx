"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { projects, dailyGeneration, monthlyGeneration } from "@/lib/data";
import { formatMWh, formatNPR, getPLFColor, cn } from "@/lib/utils";
import { Zap, Droplets, ChevronLeft, ChevronRight, Plus, Save, X } from "lucide-react";

type View = "daily" | "monthly";

export default function GenerationPage() {
  const [view, setView] = useState<View>("daily");
  const [selectedProject, setSelectedProject] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "p1", date: "2026-04-18",
    plannedGeneration: "", actualGeneration: "",
    gridAvailability: "", spillHours: "", discharge: "",
  });

  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Daily: show April 2026 data
  const dailyRows = dailyGeneration
    .filter(r => selectedProject === "all" || r.projectId === selectedProject)
    .sort((a, b) => b.day - a.day);

  // Monthly: show all monthly data for selected project
  const monthlyRows = monthlyGeneration
    .filter(r => selectedProject !== "all" ? r.projectId === selectedProject : true)
    .filter(r => r.year === 2026 || r.year === 2025)
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .slice(0, 24);

  const projName = (id: string) => {
    const p = projects.find(x => x.id === id);
    return p ? p.name.split(" ").slice(0, 2).join(" ") : id;
  };

  const projColor = (id: string) => projects.find(x => x.id === id)?.color ?? "#3b82f6";

  return (
    <div className="min-h-screen">
      <TopBar title="Generation Log" />
      <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-[#0f1929] border border-[#1e3a5f] rounded-xl overflow-hidden">
            {(["daily", "monthly"] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 text-sm font-medium capitalize transition-colors",
                  view === v
                    ? "bg-blue-500/15 text-blue-400 border-r border-[#1e3a5f]"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Project filter */}
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="bg-[#0f1929] border border-[#1e3a5f] text-sm text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500/50"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddForm(true)}
            className="ml-auto btn-primary text-sm font-medium px-4 py-2 rounded-xl text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>

        {/* Add entry form */}
        {showAddForm && (
          <div className="bg-[#0f1929] border border-blue-500/30 rounded-2xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                Log Daily Generation
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Project</label>
                <select
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Planned Generation (MWh)</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={formData.plannedGeneration}
                  onChange={e => setFormData({ ...formData, plannedGeneration: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Actual Generation (MWh)</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={formData.actualGeneration}
                  onChange={e => setFormData({ ...formData, actualGeneration: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Grid Availability (%)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={formData.gridAvailability}
                  onChange={e => setFormData({ ...formData, gridAvailability: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">River Discharge (m³/s)</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={formData.discharge}
                  onChange={e => setFormData({ ...formData, discharge: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-primary flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
              >
                <Save className="w-4 h-4" />
                Save Entry
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-[#162035] border border-[#1e3a5f]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Daily table */}
        {view === "daily" && (
          <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e3a5f]">
              <h2 className="font-semibold text-white">Daily Generation — April 2026</h2>
              <p className="text-xs text-gray-500 mt-0.5">Showing {dailyRows.length} records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e3a5f]">
                    {["Date", "Project", "Planned (MWh)", "Actual (MWh)", "Achievement", "Grid Avail.", "Discharge (m³/s)", "Revenue (NPR)"].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((r, i) => {
                    const achievement = Math.round((r.actualGeneration / r.plannedGeneration) * 100);
                    const proj = projects.find(p => p.id === r.projectId);
                    return (
                      <tr key={r.id} className={cn("border-b border-[#1e3a5f]/50 hover:bg-[#162035] transition-colors",
                        i % 2 === 0 ? "" : "bg-[#0f1929]/50")}>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">Apr {r.day}, 2026</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: proj?.color }} />
                            <span className="text-gray-300 whitespace-nowrap">{proj ? proj.name.split(" ").slice(0, 2).join(" ") : r.projectId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{r.plannedGeneration.toFixed(1)}</td>
                        <td className="px-4 py-3 font-medium text-white">{r.actualGeneration.toFixed(1)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(achievement, 100)}%`,
                                  background: achievement >= 90 ? "#22c55e" : achievement >= 70 ? "#3b82f6" : "#f59e0b"
                                }}
                              />
                            </div>
                            <span className={cn("text-xs font-medium",
                              achievement >= 90 ? "text-green-400" : achievement >= 70 ? "text-blue-400" : "text-amber-400"
                            )}>{achievement}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{r.gridAvailability.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-gray-400">{r.discharge?.toFixed(1) ?? "—"}</td>
                        <td className="px-4 py-3 text-green-400 font-medium">{formatNPR(r.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly table */}
        {view === "monthly" && (
          <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e3a5f]">
              <h2 className="font-semibold text-white">Monthly Generation Summary</h2>
              <p className="text-xs text-gray-500 mt-0.5">Showing {monthlyRows.length} records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e3a5f]">
                    {["Period", "Project", "Season", "Planned (MWh)", "Actual (MWh)", "PLF", "Grid Avail.", "Spill Hrs", "Revenue"].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyRows.map((r, i) => {
                    const proj = projects.find(p => p.id === r.projectId);
                    return (
                      <tr key={r.id} className={cn("border-b border-[#1e3a5f]/50 hover:bg-[#162035] transition-colors",
                        i % 2 === 0 ? "" : "bg-[#0f1929]/50")}>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{r.monthName} {r.year}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: proj?.color }} />
                            <span className="text-gray-300 whitespace-nowrap">{proj ? proj.name.split(" ").slice(0, 2).join(" ") : r.projectId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full",
                            r.isWetSeason
                              ? "text-blue-400 bg-blue-500/10"
                              : "text-amber-400 bg-amber-500/10"
                          )}>
                            {r.isWetSeason ? "Wet" : "Dry"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{(r.plannedGeneration / 1000).toFixed(1)} GWh</td>
                        <td className="px-4 py-3 font-medium text-white">{(r.actualGeneration / 1000).toFixed(1)} GWh</td>
                        <td className="px-4 py-3">
                          <span className={cn("font-semibold", getPLFColor(r.plf))}>{r.plf.toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{r.gridAvailability.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-gray-400">{r.spillHours}h</td>
                        <td className="px-4 py-3 text-green-400 font-medium">{formatNPR(r.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
