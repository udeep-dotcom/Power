"use client";
import TopBar from "@/components/layout/TopBar";
import { leaderboard, currentUser } from "@/lib/data";
import { formatNumber, getLevelTitle, getInitials } from "@/lib/utils";
import { Trophy, Zap, Flame, Crown } from "lucide-react";
import { useState } from "react";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "alltime">("weekly");

  return (
    <div className="animate-fade-in">
      <TopBar title="Leaderboard" />
      <div className="px-4 lg:px-6 py-5 max-w-2xl mx-auto">
        {/* Period tabs */}
        <div className="flex gap-2 mb-6 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1">
          {(["weekly", "monthly", "alltime"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                period === p ? "bg-green-500/10 text-green-400 border border-green-500/20" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {p === "alltime" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-sm font-black text-white mb-2 border-2 border-gray-400/50">
              {getInitials(leaderboard[1].name)}
            </div>
            <p className="text-xs text-white font-semibold text-center mb-1">{leaderboard[1].name.split(" ")[0]}</p>
            <p className="text-xs text-gray-500 mb-2">{formatNumber(leaderboard[1].points)} pts</p>
            <div className="w-20 h-16 bg-gradient-to-t from-gray-600/30 to-gray-500/10 border border-gray-500/20 rounded-t-xl flex items-end justify-center pb-2">
              <span className="text-2xl">🥈</span>
            </div>
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center -mb-2">
            <Crown className="w-5 h-5 text-yellow-400 mb-1 animate-streak" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-base font-black text-black mb-2 border-2 border-yellow-400/50">
              {getInitials(leaderboard[0].name)}
            </div>
            <p className="text-xs text-white font-bold text-center mb-1">{leaderboard[0].name.split(" ")[0]}</p>
            <p className="text-xs text-yellow-400 font-semibold mb-2">{formatNumber(leaderboard[0].points)} pts</p>
            <div className="w-20 h-24 bg-gradient-to-t from-yellow-600/30 to-yellow-500/10 border border-yellow-500/20 rounded-t-xl flex items-end justify-center pb-2">
              <span className="text-2xl">🥇</span>
            </div>
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-sm font-black text-white mb-2 border-2 border-amber-600/50">
              {getInitials(leaderboard[2].name)}
            </div>
            <p className="text-xs text-white font-semibold text-center mb-1">{leaderboard[2].name.split(" ")[0]}</p>
            <p className="text-xs text-gray-500 mb-2">{formatNumber(leaderboard[2].points)} pts</p>
            <div className="w-20 h-12 bg-gradient-to-t from-amber-700/30 to-amber-600/10 border border-amber-600/20 rounded-t-xl flex items-end justify-center pb-2">
              <span className="text-2xl">🥉</span>
            </div>
          </div>
        </div>

        {/* Full list */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Full Rankings
            </h3>
            <span className="text-xs text-gray-500">Week of Mar 24, 2026</span>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {leaderboard.map((user) => (
              <div
                key={user.rank}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                  user.isYou
                    ? "bg-green-500/5 border-l-2 border-green-500"
                    : "hover:bg-[#161616]"
                }`}
              >
                {/* Rank */}
                <div className="w-7 text-center shrink-0">
                  {user.rank <= 3 ? (
                    <span className="text-lg">{["🥇","🥈","🥉"][user.rank-1]}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-500">#{user.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold">
                    {getInitials(user.name)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#111111] border border-[#2a2a2a] rounded-full flex items-center justify-center text-[9px] font-bold text-gray-400">
                    {user.level}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.name}
                    {user.isYou && <span className="ml-1.5 text-green-400 text-xs font-normal">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{getLevelTitle(user.level)} · Lvl {user.level}</p>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-1 text-xs text-orange-400 font-medium">
                  <Flame className="w-3 h-3" />
                  {user.streak}d
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    {formatNumber(user.points)}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    user.change === "up" ? "text-green-400" : user.change === "down" ? "text-red-400" : "text-gray-600"
                  }`}>
                    {user.change === "up" ? "↑ rising" : user.change === "down" ? "↓ falling" : "— stable"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your stats card */}
        <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-5 mt-5">
          <h3 className="font-semibold text-white mb-4">Your Rankings Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Current Rank", value: `#${currentUser.rank}`, sub: "of 847 members", icon: "🏆" },
              { label: "Points", value: formatNumber(currentUser.points), sub: "this week", icon: "⚡" },
              { label: "To climb", value: `${leaderboard[1].points - currentUser.points}`, sub: "pts to #2", icon: "📈" },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-base font-black text-white">{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
