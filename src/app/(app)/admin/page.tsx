"use client";
import TopBar from "@/components/layout/TopBar";
import { adminStats, leaderboard } from "@/lib/data";
import { Users, TrendingUp, Activity, DollarSign, Shield, BarChart3, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "content" | "analytics">("overview");

  return (
    <div className="animate-fade-in">
      <TopBar title="Admin Panel" />
      <div className="px-4 lg:px-6 py-5 max-w-5xl mx-auto">
        {/* Admin badge */}
        <div className="flex items-center gap-2 mb-5 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2.5 w-fit">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-400">Admin Dashboard</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1 overflow-x-auto">
          {(["overview", "members", "content", "analytics"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-green-500/10 text-green-400 border border-green-500/20" : "text-gray-500 hover:text-gray-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Key metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total Members", value: adminStats.totalMembers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", trend: "+18 this week" },
                { label: "Active Today", value: adminStats.activeToday, icon: Activity, color: "text-green-400", bg: "bg-green-400/10", trend: "14.6% of members" },
                { label: "Retention Rate", value: `${adminStats.retentionRate}%`, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10", trend: "+3% vs last month" },
                { label: "Monthly Revenue", value: `$${adminStats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-400/10", trend: "+12% vs last month" },
              ].map(m => (
                <div key={m.label} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 card-hover">
                  <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className="text-2xl font-black text-white">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                  <p className="text-xs text-green-400 mt-1">↑ {m.trend}</p>
                </div>
              ))}
            </div>

            {/* Member growth chart */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Member Growth (6 months)
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={adminStats.memberGrowth}>
                  <defs>
                    <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} domain={[600, 900]} />
                  <Tooltip contentStyle={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 12, color: "#fff" }} />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} fill="url(#mGrad)" dot={{ fill: "#22c55e", r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Peak hours */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400" />
                Peak Hours Today
              </h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={adminStats.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 12, color: "#fff" }} />
                  <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Send Announcement", icon: "📢", color: "text-blue-400" },
                { label: "Add New Workout", icon: "💪", color: "text-green-400" },
                { label: "Create Challenge", icon: "🏆", color: "text-yellow-400" },
                { label: "Manage Classes", icon: "📅", color: "text-purple-400" },
                { label: "Export Reports", icon: "📊", color: "text-orange-400" },
                { label: "System Settings", icon: "⚙️", color: "text-gray-400" },
              ].map(a => (
                <button key={a.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex items-center gap-3 hover:border-green-500/30 transition-all text-left card-hover">
                  <span className="text-2xl">{a.icon}</span>
                  <span className={`text-sm font-medium ${a.color}`}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">All Members ({adminStats.totalMembers})</h3>
              <button className="btn-primary px-4 py-2 rounded-xl text-sm text-white font-semibold">+ Add Member</button>
            </div>
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-5 px-4 py-2.5 border-b border-[#1f1f1f] text-xs text-gray-500 font-medium uppercase tracking-wider">
                <span>Member</span>
                <span>Level</span>
                <span>Streak</span>
                <span>Points</span>
                <span>Actions</span>
              </div>
              {leaderboard.map((user) => (
                <div key={user.rank} className="grid grid-cols-5 px-4 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-sm text-white">{user.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">Lvl {user.level}</span>
                  <span className="text-sm text-orange-400">🔥 {user.streak}d</span>
                  <span className="text-sm text-white font-medium">{user.points.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                    <button className="text-xs text-red-400 hover:text-red-300">Ban</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                Content Moderation Queue
              </h3>
              <div className="space-y-3">
                {[
                  { user: "Tyler B.", content: "Post about supplements...", flags: 2, time: "10 min ago" },
                  { user: "Unknown", content: "Spam link in community feed", flags: 5, time: "25 min ago" },
                  { user: "Kai N.", content: "Inappropriate image uploaded", flags: 3, time: "1 hour ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white">{item.user}</span>
                        <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 rounded">{item.flags} flags</span>
                        <span className="text-xs text-gray-500">{item.time}</span>
                      </div>
                      <p className="text-xs text-gray-400">{item.content}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                      <button className="text-xs text-red-400 hover:text-red-300">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Publish Announcement</h3>
              <textarea
                placeholder="Write an announcement for all members..."
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40 resize-none"
                rows={3}
              />
              <button className="btn-primary mt-3 px-6 py-2.5 rounded-xl text-sm text-white font-semibold">
                Broadcast to All Members
              </button>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Avg Session Duration", value: "52 min", trend: "+4 min", icon: "⏱️" },
                { label: "Classes Booked (week)", value: "342", trend: "+28", icon: "📅" },
                { label: "AI Nutrition Queries", value: "1,240", trend: "+180", icon: "🤖" },
                { label: "Community Posts", value: "89", trend: "+12", icon: "📝" },
                { label: "QR Check-ins", value: "523", trend: "+45", icon: "📱" },
                { label: "Challenge Completions", value: "34", trend: "+8", icon: "🏆" },
              ].map(s => (
                <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-xl font-black text-white mt-2">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xs text-green-400 mt-1">↑ {s.trend} vs last week</p>
                </div>
              ))}
            </div>

            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">
                <BarChart3 className="w-4 h-4 text-green-400 inline mr-2" />
                Revenue Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Monthly Memberships", value: "$31,200", pct: 73 },
                  { label: "Personal Training", value: "$8,400", pct: 20 },
                  { label: "Merchandise", value: "$2,100", pct: 5 },
                  { label: "Supplement Sales", value: "$1,100", pct: 2.6 },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="text-white font-medium">{r.value}</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
