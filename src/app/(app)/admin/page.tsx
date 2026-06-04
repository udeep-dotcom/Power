"use client";
import TopBar from "@/components/layout/TopBar";
import { adminStats, leaderboard } from "@/lib/data";
import { Users, TrendingUp, Activity, DollarSign, Shield, BarChart3, Clock, AlertCircle, CheckCircle2, Music, Tv, Mic, Play, Pause, SkipForward, SkipBack, Volume2, Thermometer, Wind, Sun, Radio, Zap } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "content" | "analytics" | "remote-control">("overview");

  // Remote control state
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(72);
  const [currentTrack, setCurrentTrack] = useState("Power Hour Mix Vol. 3");
  const [selectedPlaylist, setSelectedPlaylist] = useState("workout");
  const [zones, setZones] = useState([
    { name: "Main Floor", icon: "🏋️", lighting: 85, temp: 68, fan: 60, active: true },
    { name: "Cardio Zone", icon: "🏃", lighting: 90, temp: 65, fan: 80, active: true },
    { name: "Weight Room", icon: "💪", lighting: 75, temp: 70, fan: 50, active: true },
    { name: "Yoga Studio", icon: "🧘", lighting: 40, temp: 72, fan: 30, active: true },
    { name: "Pool Area", icon: "🏊", lighting: 95, temp: 78, fan: 20, active: false },
  ]);
  const [screens, setScreens] = useState([
    { id: 1, location: "Main Entrance", content: "leaderboard", on: true },
    { id: 2, location: "Cardio Zone", content: "class-schedule", on: true },
    { id: 3, location: "Weight Room", content: "workout-tips", on: true },
    { id: 4, location: "Lobby", content: "promo", on: false },
  ]);
  const [paMessage, setPaMessage] = useState("");
  const [paActive, setPaActive] = useState(false);

  const playlists = [
    { id: "workout", label: "Power Workout", track: "Power Hour Mix Vol. 3" },
    { id: "cardio", label: "Cardio Blast", track: "High Energy Run Mix" },
    { id: "chill", label: "Cool Down", track: "Post-Workout Chill" },
    { id: "hype", label: "Hype Mode", track: "Beast Mode Anthems" },
  ];

  const screenContents = ["leaderboard", "class-schedule", "workout-tips", "promo", "live-class", "announcements"];

  const updateZone = (idx: number, field: "lighting" | "temp" | "fan", val: number) =>
    setZones(z => z.map((zone, i) => i === idx ? { ...zone, [field]: val } : zone));

  const toggleZone = (idx: number) =>
    setZones(z => z.map((zone, i) => i === idx ? { ...zone, active: !zone.active } : zone));

  const updateScreen = (id: number, field: "content" | "on", val: string | boolean) =>
    setScreens(s => s.map(scr => scr.id === id ? { ...scr, [field]: val } : scr));

  const handlePlaylistChange = (id: string) => {
    const pl = playlists.find(p => p.id === id);
    if (pl) { setSelectedPlaylist(id); setCurrentTrack(pl.track); }
  };

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
          {(["overview", "members", "content", "analytics", "remote-control"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-green-500/10 text-green-400 border border-green-500/20" : "text-gray-500 hover:text-gray-300"}`}
            >
              {tab === "remote-control" ? "Remote Control" : tab}
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
        {activeTab === "remote-control" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2.5 w-fit">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">Live Gym Controls</span>
            </div>

            {/* Music Player */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Music className="w-4 h-4 text-green-400" />
                Music System
              </h3>
              <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{currentTrack}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Gym Floor Speakers · All Zones</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${isPlaying ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {isPlaying ? "● Live" : "Paused"}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-6 mb-4">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(p => !p)}
                    className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-colors shadow-lg shadow-green-500/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-0.5" />}
                  </button>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-gray-500 shrink-0" />
                  <input
                    type="range" min={0} max={100} value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                    className="flex-1 accent-green-500 h-1.5"
                  />
                  <span className="text-xs text-gray-400 w-8 text-right">{volume}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {playlists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => handlePlaylistChange(pl.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${selectedPlaylist === pl.id ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white"}`}
                  >
                    {pl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gym Zones */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Sun className="w-4 h-4 text-yellow-400" />
                Zone Controls
              </h3>
              <div className="space-y-3">
                {zones.map((zone, idx) => (
                  <div key={zone.name} className={`rounded-xl border p-4 transition-all ${zone.active ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#141414] border-[#1a1a1a] opacity-60"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{zone.icon}</span>
                        <span className="text-sm font-semibold text-white">{zone.name}</span>
                      </div>
                      <button
                        onClick={() => toggleZone(idx)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${zone.active ? "bg-green-500" : "bg-gray-700"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${zone.active ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {zone.active && (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="flex items-center gap-1 mb-1.5">
                            <Sun className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-gray-500">Lighting</span>
                            <span className="text-xs text-white ml-auto">{zone.lighting}%</span>
                          </div>
                          <input type="range" min={0} max={100} value={zone.lighting}
                            onChange={e => updateZone(idx, "lighting", Number(e.target.value))}
                            className="w-full accent-yellow-400 h-1"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1.5">
                            <Thermometer className="w-3 h-3 text-orange-400" />
                            <span className="text-xs text-gray-500">Temp</span>
                            <span className="text-xs text-white ml-auto">{zone.temp}°F</span>
                          </div>
                          <input type="range" min={60} max={85} value={zone.temp}
                            onChange={e => updateZone(idx, "temp", Number(e.target.value))}
                            className="w-full accent-orange-400 h-1"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1.5">
                            <Wind className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-gray-500">Fan</span>
                            <span className="text-xs text-white ml-auto">{zone.fan}%</span>
                          </div>
                          <input type="range" min={0} max={100} value={zone.fan}
                            onChange={e => updateZone(idx, "fan", Number(e.target.value))}
                            className="w-full accent-blue-400 h-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TV Screens */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Tv className="w-4 h-4 text-purple-400" />
                Display Screens
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {screens.map(scr => (
                  <div key={scr.id} className={`rounded-xl border p-4 ${scr.on ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#141414] border-[#1a1a1a] opacity-60"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">{scr.location}</span>
                      </div>
                      <button
                        onClick={() => updateScreen(scr.id, "on", !scr.on)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${scr.on ? "bg-purple-500" : "bg-gray-700"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${scr.on ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {scr.on && (
                      <select
                        value={scr.content}
                        onChange={e => updateScreen(scr.id, "content", e.target.value)}
                        className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500/40 capitalize"
                      >
                        {screenContents.map(c => (
                          <option key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PA System */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4 text-red-400" />
                PA System
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Class starting in 5 min", preset: "⚠️ Attention: A class is starting in 5 minutes in the Yoga Studio. Please clear the area." },
                  { label: "Gym closing in 30 min", preset: "🔔 Heads up! The gym will be closing in 30 minutes. Please begin wrapping up your session." },
                  { label: "Equipment maintenance", preset: "🔧 The treadmills in the Cardio Zone are temporarily out of service. We apologize for the inconvenience." },
                  { label: "Happy hour promo", preset: "🎉 Happy Hour! All smoothies and supplements are 20% off for the next hour at the front desk." },
                  { label: "New class open", preset: "📣 New class alert: HIIT Bootcamp just opened up for tomorrow at 7am. Sign up at the front desk or in the app." },
                  { label: "Emergency clear floor", preset: "🚨 All members: please clear the gym floor immediately. Staff assistance is required." },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => setPaMessage(p.preset)}
                    className="text-left text-xs text-gray-400 hover:text-white bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-red-500/20 rounded-xl px-3 py-2.5 transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <textarea
                value={paMessage}
                onChange={e => setPaMessage(e.target.value)}
                placeholder="Type a custom PA announcement..."
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 resize-none mb-3"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setPaActive(true); setTimeout(() => setPaActive(false), 3000); }}
                  disabled={!paMessage.trim()}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${paMessage.trim() ? "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20" : "bg-[#1a1a1a] text-gray-600 cursor-not-allowed"}`}
                >
                  <Radio className="w-4 h-4" />
                  {paActive ? "Broadcasting..." : "Broadcast Now"}
                </button>
                {paActive && (
                  <div className="flex items-center gap-2 text-sm text-red-400 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Live on all speakers
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
