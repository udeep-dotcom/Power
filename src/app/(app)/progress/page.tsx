"use client";
import TopBar from "@/components/layout/TopBar";
import { progressLogs, weeklyStats, currentUser } from "@/lib/data";
import { TrendingUp, TrendingDown, Activity, BarChart3, Plus } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const weightData = progressLogs.map(l => ({ date: new Date(l.date).toLocaleDateString("en", { month: "short", day: "numeric" }), weight: l.weight }));
const calorieData = weeklyStats.map(d => ({ day: d.day, calories: d.calories, protein: d.protein }));

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<"body" | "performance" | "nutrition">("body");

  const latestWeight = progressLogs[progressLogs.length - 1].weight;
  const startWeight = progressLogs[0].weight;
  const weightChange = latestWeight - startWeight;

  return (
    <div className="animate-fade-in">
      <TopBar title="Progress" />
      <div className="px-4 lg:px-6 py-5 max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1">
          {(["body", "performance", "nutrition"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-green-500/10 text-green-400 border border-green-500/20" : "text-gray-500 hover:text-gray-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "body" && (
          <div className="space-y-5">
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Current Weight", value: `${latestWeight}kg`, sub: `${weightChange > 0 ? "+" : ""}${weightChange}kg since Jan`, trend: weightChange < 0 ? "down" : "up", color: weightChange < 0 ? "text-green-400" : "text-red-400" },
                { label: "Body Fat (est.)", value: "16%", sub: "-2% since Jan", trend: "down", color: "text-green-400" },
              ].map(m => (
                <div key={m.label} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-2">{m.label}</p>
                  <p className="text-2xl font-black text-white mb-1">{m.value}</p>
                  <p className={`text-xs font-medium flex items-center gap-1 ${m.color}`}>
                    {m.trend === "down" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {m.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Weight chart */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Weight Trend</h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} domain={[75, 85]} />
                  <Tooltip contentStyle={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 12, color: "#fff" }} />
                  <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} fill="url(#wGrad)" dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Body measurements */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Body Measurements</h3>
                <button className="text-xs text-green-400 border border-green-500/20 rounded-lg px-3 py-1.5 hover:bg-green-500/5 transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Log
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Chest", current: 105, prev: 102, unit: "cm" },
                  { label: "Waist", current: 83, prev: 88, unit: "cm" },
                  { label: "Hips", current: 96, prev: 98, unit: "cm" },
                  { label: "Arms (L/R)", current: 38, prev: 36, unit: "cm" },
                  { label: "Thighs", current: 56, prev: 54, unit: "cm" },
                ].map(m => {
                  const change = m.current - m.prev;
                  const isGood = m.label === "Waist" || m.label === "Hips" ? change < 0 : change > 0;
                  return (
                    <div key={m.label} className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
                      <span className="text-sm text-gray-400 w-28 shrink-0">{m.label}</span>
                      <span className="text-sm font-bold text-white">{m.current}{m.unit}</span>
                      <span className={`text-xs font-medium ml-auto flex items-center gap-1 ${isGood ? "text-green-400" : "text-red-400"}`}>
                        {change > 0 ? "+" : ""}{change}{m.unit}
                        {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-5">
            {/* Weekly workouts bar chart */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Weekly Check-ins
              </h3>
              <div className="flex items-end gap-2 h-32">
                {weeklyStats.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative flex items-end" style={{ height: "96px" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${d.checkin ? "bg-green-500" : "bg-[#1f1f1f]"}`}
                        style={{ height: d.checkin ? "80%" : "20%" }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strength PRs */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Personal Records</h3>
              <div className="space-y-3">
                {[
                  { lift: "Bench Press", current: "100kg × 5", prev: "90kg × 5", pr: true },
                  { lift: "Squat", current: "130kg × 3", prev: "120kg × 3", pr: true },
                  { lift: "Deadlift", current: "150kg × 3", prev: "150kg × 3", pr: false },
                  { lift: "Overhead Press", current: "70kg × 5", prev: "65kg × 5", pr: true },
                  { lift: "Pull-ups", current: "15 reps", prev: "12 reps", pr: true },
                ].map(lift => (
                  <div key={lift.lift} className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{lift.lift}</p>
                        {lift.pr && <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">NEW PR</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Prev: {lift.prev}</p>
                    </div>
                    <p className="text-sm font-bold text-green-400">{lift.current}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Workouts", value: currentUser.stats.totalWorkouts, icon: "💪" },
                { label: "Hours Trained", value: Math.round(currentUser.stats.totalWorkouts * 0.75) + "h", icon: "⏱️" },
                { label: "Calories Burned", value: "48k", icon: "🔥" },
              ].map(s => (
                <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "nutrition" && (
          <div className="space-y-5">
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                Weekly Calories
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={calorieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 12, color: "#fff" }} />
                  <Bar dataKey="calories" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Avg Daily Calories", value: "2,784", trend: "+2.1%", good: true },
                { label: "Avg Protein", value: "174g", trend: "+8g", good: true },
                { label: "Meal Adherence", value: "82%", trend: "+5%", good: true },
                { label: "Days Tracked", value: "21/31", trend: "this month", good: true },
              ].map(s => (
                <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">{s.label}</p>
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className={`text-xs mt-1 ${s.good ? "text-green-400" : "text-red-400"}`}>{s.trend}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
