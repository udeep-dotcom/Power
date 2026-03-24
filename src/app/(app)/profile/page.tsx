"use client";
import TopBar from "@/components/layout/TopBar";
import { currentUser, badges } from "@/lib/data";
import { getInitials, getLevelTitle, getLevelColor, getStreakEmoji, formatNumber } from "@/lib/utils";
import { Settings, Edit3, Share2, Flame, Trophy, Dumbbell, Target, Zap } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="animate-fade-in">
      <TopBar title="Profile" />
      <div className="px-4 lg:px-6 py-5 max-w-2xl mx-auto">
        {/* Profile header */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl font-black text-white">
                  {getInitials(currentUser.name)}
                </div>
                <span className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-[#111111]">
                  {currentUser.level}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{currentUser.name}</h2>
                <p className={`text-sm font-semibold ${getLevelColor(currentUser.level)}`}>
                  {getLevelTitle(currentUser.level)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Member since Jan 2024</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-all">
                <Share2 className="w-4 h-4" />
              </button>
              <Link href="/settings" className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-all">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* XP progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Level {currentUser.level} Progress</span>
              <span className="text-white font-medium">{currentUser.xp}/{currentUser.xpToNext} XP</span>
            </div>
            <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full progress-fill"
                style={{ width: `${(currentUser.xp / currentUser.xpToNext) * 100}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Flame, label: "Streak", value: `${currentUser.streak}d`, color: "text-orange-400" },
              { icon: Trophy, label: "Rank", value: `#${currentUser.rank}`, color: "text-yellow-400" },
              { icon: Zap, label: "Points", value: formatNumber(currentUser.points), color: "text-purple-400" },
              { icon: Dumbbell, label: "Workouts", value: `${currentUser.stats.totalWorkouts}`, color: "text-blue-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                <p className="text-sm font-black text-white">{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Fitness Goals
            </h3>
            <button className="text-xs text-gray-400 hover:text-green-400 flex items-center gap-1 transition-colors">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Primary Goal", value: "Muscle Gain", icon: "💪" },
              { label: "Current Weight", value: `${currentUser.weight}kg`, icon: "⚖️" },
              { label: "Height", value: `${currentUser.height}cm`, icon: "📏" },
              { label: "Daily Calories", value: `${currentUser.calorieGoal} kcal`, icon: "🔥" },
            ].map(g => (
              <div key={g.label} className="bg-[#1a1a1a] rounded-xl p-3">
                <span className="text-lg">{g.icon}</span>
                <p className="text-sm font-bold text-white mt-1">{g.value}</p>
                <p className="text-xs text-gray-500">{g.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Badges & Achievements</h3>
            <span className="text-xs text-gray-500">{earnedBadges.length}/{badges.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {badges.map(b => (
              <div key={b.id} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                b.earned ? "bg-[#1a1a1a] border-[#2a2a2a]" : "opacity-25 bg-[#151515] border-[#1f1f1f] border-dashed"
              }`} title={b.desc}>
                <span className="text-2xl">{b.icon}</span>
                <p className="text-[10px] text-gray-400 text-center leading-tight">{b.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Streak history */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Streak Status {getStreakEmoji(currentUser.streak)}
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
              <p className="text-xl font-black text-orange-400">{currentUser.streak}</p>
              <p className="text-xs text-gray-500">Current</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
              <p className="text-xl font-black text-white">{currentUser.longestStreak}</p>
              <p className="text-xs text-gray-500">Best Ever</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
              <p className="text-xl font-black text-white">{currentUser.stats.totalCheckins}</p>
              <p className="text-xs text-gray-500">Total Days</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            You&apos;re in the top <span className="text-green-400 font-semibold">10%</span> of members for consistency 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
