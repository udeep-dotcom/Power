"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { alerts, projects } from "@/lib/data";
import { getSeverityColor, cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Bell, Wrench, Zap, Shield, Send, Loader } from "lucide-react";

type Filter = "all" | "active" | "resolved";
type TypeFilter = "all" | "critical" | "warning" | "info";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  maintenance: Wrench,
  underperformance: Zap,
  grid: Bell,
  compliance: Shield,
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [notifying, setNotifying] = useState<string | null>(null);
  const [notifyResults, setNotifyResults] = useState<Record<string, { sent: number; message: string }>>({});

  async function triggerNotification(alertId: string) {
    setNotifying(alertId);
    try {
      const res = await fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      const data = await res.json();
      setNotifyResults(prev => ({ ...prev, [alertId]: { sent: data.sent ?? 0, message: data.message } }));
    } catch {
      setNotifyResults(prev => ({ ...prev, [alertId]: { sent: 0, message: "Failed to send notifications" } }));
    } finally {
      setNotifying(null);
    }
  }

  const visible = alerts.filter(a => {
    if (dismissed.has(a.id)) return false;
    if (filter === "active" && a.resolved) return false;
    if (filter === "resolved" && !a.resolved) return false;
    if (typeFilter !== "all" && a.severity !== typeFilter) return false;
    return true;
  });

  const criticalCount = alerts.filter(a => !a.resolved && a.severity === "critical").length;
  const warningCount = alerts.filter(a => !a.resolved && a.severity === "warning").length;
  const infoCount = alerts.filter(a => !a.resolved && a.severity === "info").length;

  return (
    <div className="min-h-screen">
      <TopBar title="Alerts" />
      <div className="p-4 lg:p-6 space-y-5 animate-fade-in">

        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
            <p className="text-xs text-gray-500 mt-1">Critical</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{warningCount}</p>
            <p className="text-xs text-gray-500 mt-1">Warnings</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{infoCount}</p>
            <p className="text-xs text-gray-500 mt-1">Info</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-[#0f1929] border border-[#1e3a5f] rounded-xl overflow-hidden">
            {(["active", "all", "resolved"] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-xs font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex bg-[#0f1929] border border-[#1e3a5f] rounded-xl overflow-hidden">
            {(["all", "critical", "warning", "info"] as TypeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  "px-3 py-2 text-xs font-medium capitalize transition-colors",
                  typeFilter === f
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-auto">{visible.length} alerts</span>
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-50" />
              <p>No alerts matching your filters</p>
            </div>
          )}
          {visible.map(a => {
            const proj = projects.find(p => p.id === a.projectId);
            const TypeIcon = typeIcons[a.type] ?? Bell;
            const borderColors: Record<string, string> = {
              critical: "border-l-red-500",
              warning: "border-l-amber-500",
              info: "border-l-blue-500",
              resolved: "border-l-green-500",
            };
            const severity = a.resolved ? "resolved" : a.severity;
            return (
              <div
                key={a.id}
                className={cn(
                  "bg-[#0f1929] border border-[#1e3a5f] border-l-4 rounded-xl p-4",
                  borderColors[severity]
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    getSeverityColor(severity)
                  )}>
                    <TypeIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white text-sm">{a.title}</h3>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full border capitalize",
                        getSeverityColor(severity)
                      )}>
                        {a.resolved ? "Resolved" : a.severity}
                      </span>
                      <span className="text-xs text-gray-500 bg-[#162035] px-2 py-0.5 rounded-full capitalize">
                        {a.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: proj?.color ?? "#3b82f6" }} />
                      <span className="text-xs text-gray-400">{proj?.name}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{a.date}</span>
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">{a.message}</p>

                    {/* Notification result */}
                    {notifyResults[a.id] && (
                      <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {notifyResults[a.id].message}
                      </div>
                    )}
                  </div>

                  {!a.resolved && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => triggerNotification(a.id)}
                        disabled={notifying === a.id}
                        className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {notifying === a.id
                          ? <Loader className="w-3 h-3 animate-spin" />
                          : <Send className="w-3 h-3" />
                        }
                        Notify
                      </button>
                      <button
                        onClick={() => setDismissed(prev => new Set(prev).add(a.id))}
                        className="text-xs text-gray-500 hover:text-white bg-[#162035] border border-[#1e3a5f] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  {a.resolved && (
                    <div className="flex items-center gap-1 text-xs text-green-400 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolved
                    </div>
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
