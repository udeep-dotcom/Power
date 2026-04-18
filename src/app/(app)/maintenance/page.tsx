"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { maintenanceLogs, projects } from "@/lib/data";
import { formatNPR, cn } from "@/lib/utils";
import {
  Wrench, Calendar, User, AlertCircle, CheckCircle2,
  Clock, Plus, X, Save, DollarSign, Zap
} from "lucide-react";

type StatusFilter = "all" | "scheduled" | "in-progress" | "completed";

const statusColors: Record<string, string> = {
  "scheduled": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "in-progress": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "completed": "text-green-400 bg-green-500/10 border-green-500/20",
};

const typeColors: Record<string, string> = {
  "preventive": "text-cyan-400 bg-cyan-500/10",
  "corrective": "text-red-400 bg-red-500/10",
};

export default function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    projectId: "p1", date: "2026-04-18", type: "preventive",
    component: "", description: "", estimatedDays: "1",
    technician: "", cost: "",
  });

  const visible = maintenanceLogs.filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (projectFilter !== "all" && m.projectId !== projectFilter) return false;
    return true;
  });

  const inProgress = maintenanceLogs.filter(m => m.status === "in-progress").length;
  const scheduled = maintenanceLogs.filter(m => m.status === "scheduled").length;
  const totalCostYTD = maintenanceLogs
    .filter(m => m.status === "completed")
    .reduce((s, m) => s + m.cost, 0);
  const totalGenLoss = maintenanceLogs.reduce((s, m) => s + m.generationLoss, 0);

  return (
    <div className="min-h-screen">
      <TopBar title="Maintenance Log" />
      <div className="p-4 lg:p-6 space-y-5 animate-fade-in">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{inProgress}</p>
            <p className="text-xs text-gray-500 mt-1">In Progress</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{scheduled}</p>
            <p className="text-xs text-gray-500 mt-1">Scheduled</p>
          </div>
          <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-white">{formatNPR(totalCostYTD)}</p>
            <p className="text-xs text-gray-500 mt-1">Maintenance Cost YTD</p>
          </div>
          <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-red-400">{totalGenLoss.toLocaleString()} MWh</p>
            <p className="text-xs text-gray-500 mt-1">Generation Loss</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-[#0f1929] border border-[#1e3a5f] rounded-xl overflow-hidden">
            {(["all", "in-progress", "scheduled", "completed"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-2 text-xs font-medium transition-colors capitalize whitespace-nowrap",
                  statusFilter === s
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="bg-[#0f1929] border border-[#1e3a5f] text-sm text-white rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto btn-primary text-sm font-medium px-4 py-2 rounded-xl text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Work Order
          </button>
        </div>

        {/* Add work order form */}
        {showForm && (
          <div className="bg-[#0f1929] border border-blue-500/30 rounded-2xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                New Work Order
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Project</label>
                <select
                  value={form.projectId}
                  onChange={e => setForm({ ...form, projectId: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input
                  type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none"
                >
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Component</label>
                <input
                  type="text" placeholder="e.g. Turbine Unit #1"
                  value={form.component}
                  onChange={e => setForm({ ...form, component: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Technician</label>
                <input
                  type="text" placeholder="Lead technician name"
                  value={form.technician}
                  onChange={e => setForm({ ...form, technician: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Est. Duration (days)</label>
                <input
                  type="number" placeholder="1"
                  value={form.estimatedDays}
                  onChange={e => setForm({ ...form, estimatedDays: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div className="col-span-2 lg:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea
                  placeholder="Describe the maintenance work..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Estimated Cost (NPR)</label>
                <input
                  type="number" placeholder="0"
                  value={form.cost}
                  onChange={e => setForm({ ...form, cost: e.target.value })}
                  className="w-full bg-[#162035] border border-[#1e3a5f] text-sm text-white rounded-lg px-3 py-2 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="btn-primary flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
              >
                <Save className="w-4 h-4" />
                Create Work Order
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-[#162035] border border-[#1e3a5f]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Maintenance log list */}
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-40" />
              <p>No maintenance records found</p>
            </div>
          )}
          {visible.map(m => {
            const proj = projects.find(p => p.id === m.projectId);
            return (
              <div
                key={m.id}
                className="bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-5 card-hover"
              >
                <div className="flex items-start gap-4">
                  {/* Status indicator */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    statusColors[m.status]
                  )}>
                    {m.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : m.status === "in-progress" ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{m.component}</h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize", statusColors[m.status])}>
                        {m.status}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", typeColors[m.type])}>
                        {m.type}
                      </span>
                    </div>

                    {/* Project & date */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: proj?.color ?? "#3b82f6" }} />
                        <span className="text-xs text-gray-400">{proj?.name}</span>
                      </div>
                      <span className="text-xs text-gray-600">·</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {m.date}
                        {m.completedDate && ` → ${m.completedDate}`}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {m.technician}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">{m.description}</p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {m.status === "completed" && m.duration
                          ? `${m.duration}h actual`
                          : `~${m.estimatedDays} day${m.estimatedDays !== 1 ? "s" : ""} estimated`}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatNPR(m.cost)}
                      </div>
                      {m.generationLoss > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400">
                          <Zap className="w-3.5 h-3.5" />
                          {m.generationLoss.toLocaleString()} MWh generation loss
                        </div>
                      )}
                      {m.generationLoss === 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-green-400">
                          <Zap className="w-3.5 h-3.5" />
                          No generation impact
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {m.status !== "completed" && (
                    <button className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 shrink-0 transition-colors">
                      {m.status === "scheduled" ? "Start Work" : "Mark Complete"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
