"use client";
import TopBar from "@/components/layout/TopBar";
import { currentUser, leaderboard, workouts, weeklyStats, badges } from "@/lib/data";
import { getStreakEmoji, getLevelTitle, formatNumber } from "@/lib/utils";
import {
  Zap, Flame, TrendingUp, Dumbbell, CheckCircle2,
  Calendar, Trophy, ChevronRight, Play, Apple, Target
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const days = ["M", "T", "W", "T", "F", "S", "S"];

export default function DashboardPage() {
  const [caloriesLogged, setCaloriesLogged] = useState(0);
  const totalCalories = 1165;
  const calorieGoal = currentUser.calorieGoal;

  useEffect(() => {
    const t = setTimeout(() => setCaloriesLogged(totalCalories), 300);
    return () => clearTimeout(t);
  }, []);

  const todayWorkout = workouts[0];
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="animate-fade-in">
      <TopBar title="Dashboard" />

      <div className="px-4 lg:px-6 py-5 space-y-6 max-w-5xl mx-auto">
        {/* Greeting + Streak */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Good morning 👋</p>
            <h2 className="text-2xl font-black text-white">
              {currentUser.name.split(" ")[0]}&apos;s Dashboard
            </h2>
          </div>
          {/* Streak card */}
          <div className="flex items-center gap-3 bg-[#111111] border border-orange-500/20 rounded-2xl px-4 py-3 animate-glow">
            <div className="text-3xl animate-streak">{getStreakEmoji(currentUser.streak)}</div>
            <div>
              <p className="text-2xl font-black text-orange-400">{currentUser.streak} Days</p>
              <p className="text-xs text-gray-400">Current Streak</p>
            </div>
            <div className="ml-2 text-right">
              <p className="text-xs text-gray-500">Best</p>
              <p className="text-sm font-bold text-gray-300">{currentUser.longestStreak}d</p>
            </div>
          </div>
        </div>

        {/* Weekly Check-in Grid */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-400" />
              This Week
            </h3>
            <span className="text-xs text-gray-500">{currentUser.stats.thisWeekCheckins}/7 days</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weeklyStats.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-500">{days[i]}</span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  day.checkin
                    ? "bg-green-500 text-white"
                    : i === 6 ? "bg-[#1f1f1f] border-2 border-dashed border-green-500/30 text-gray-600"
                    : "bg-[#1a1a1a] text-gray-600"
                }`}>
                  {day.checkin ? "✓" : i === 6 ? "?" : "·"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Points", value: formatNumber(currentUser.points), icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
            { label: "Rank", value: `#${currentUser.rank}`, icon: Trophy, color: "text-purple-400", bg: "bg-purple-400/10" },
            { label: "Workouts", value: currentUser.stats.totalWorkouts, icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Check-ins", value: currentUser.stats.totalCheckins, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 card-hover">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* XP + Level */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-white">Level {currentUser.level}</span>
              <span className="text-gray-500 mx-2">·</span>
              <span className="text-sm text-green-400 font-medium">{getLevelTitle(currentUser.level)}</span>
            </div>
            <span className="text-xs text-gray-500">{currentUser.xp} / {currentUser.xpToNext} XP</span>
          </div>
          <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full progress-fill relative"
              style={{ width: `${(currentUser.xp / currentUser.xpToNext) * 100}%` }}
            >
              <div className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-lg shadow-green-500/50" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{currentUser.xpToNext - currentUser.xp} XP to Level {currentUser.level + 1}</p>
        </div>

        {/* Two-col layout */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Today's Workout */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-green-400" />
                Today&apos;s Workout
              </h3>
              <Link href="/workouts" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{todayWorkout.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">by {todayWorkout.trainer}</p>
                </div>
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20 capitalize">
                  {todayWorkout.category}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{todayWorkout.calories} kcal</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{todayWorkout.duration} min</span>
                <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{todayWorkout.exercises} exercises</span>
              </div>
              <Link href="/workouts" className="btn-primary w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                <Play className="w-3.5 h-3.5" /> Start Workout
              </Link>
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Apple className="w-4 h-4 text-green-400" />
                Today&apos;s Nutrition
              </h3>
              <Link href="/nutrition" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                Log <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Calorie ring */}
            <div className="flex items-center gap-5 mb-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#1f1f1f" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="#22c55e" strokeWidth="8"
                    strokeDasharray={`${(caloriesLogged / calorieGoal) * 201} 201`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-white">{Math.round((caloriesLogged / calorieGoal) * 100)}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Calories</span>
                    <span className="text-white font-medium">{caloriesLogged}/{calorieGoal}</span>
                  </div>
                  <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full progress-fill" style={{ width: `${(caloriesLogged / calorieGoal) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Protein</span>
                    <span className="text-white font-medium">87g / 180g</span>
                  </div>
                  <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "48%" }} />
                  </div>
                </div>
              </div>
            </div>

            <Link href="/nutrition" className="block text-center text-xs text-green-400 border border-green-500/20 rounded-xl py-2.5 hover:bg-green-500/5 transition-colors font-medium">
              + Log Meal
            </Link>
          </div>
        </div>

        {/* Leaderboard preview */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Weekly Leaderboard
            </h3>
            <Link href="/leaderboard" className="text-xs text-green-400 flex items-center gap-1">
              Full rankings <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((user) => (
              <div key={user.rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${user.isYou ? "bg-green-500/5 border border-green-500/20" : "hover:bg-[#1a1a1a]"}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  user.rank === 1 ? "bg-yellow-400 text-black" :
                  user.rank === 2 ? "bg-gray-300 text-black" :
                  user.rank === 3 ? "bg-amber-600 text-white" :
                  "text-gray-500"
                }`}>
                  {user.rank <= 3 ? ["🥇","🥈","🥉"][user.rank-1] : user.rank}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {user.name.split(" ").map(n=>n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}{user.isYou && <span className="ml-1.5 text-green-400 text-xs">(you)</span>}</p>
                  <p className="text-xs text-gray-500">Lvl {user.level} · 🔥{user.streak}d</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatNumber(user.points)}</p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
                <span className={`text-xs ${user.change === "up" ? "text-green-400" : user.change === "down" ? "text-red-400" : "text-gray-600"}`}>
                  {user.change === "up" ? "↑" : user.change === "down" ? "↓" : "–"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              My Badges
            </h3>
            <span className="text-xs text-gray-500">{earnedBadges.length}/{badges.length} earned</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {badges.map((badge) => (
              <div key={badge.id} className={`flex flex-col items-center gap-1.5 ${!badge.earned && "opacity-30"}`} title={badge.desc}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${badge.earned ? "bg-[#1f1f1f]" : "bg-[#161616] border border-[#2a2a2a] border-dashed"}`}>
                  {badge.icon}
                </div>
                <p className="text-[10px] text-gray-500 text-center leading-tight">{badge.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active challenges */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Active Challenges
            </h3>
            <Link href="/challenges" className="text-xs text-green-400 flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-3">
            {[
              { title: "30-Day Transformation", progress: 12, total: 30, emoji: "🏆" },
              { title: "7-Day Cardio Week", progress: 5, total: 7, emoji: "❤️" },
            ].map((c) => (
              <div key={c.title} className="bg-[#1a1a1a] rounded-xl p-3.5 border border-[#2a2a2a]">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-lg">{c.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{c.title}</p>
                    <p className="text-xs text-gray-500">Day {c.progress} of {c.total}</p>
                  </div>
                  <span className="text-xs font-bold text-green-400">{Math.round((c.progress/c.total)*100)}%</span>
                </div>
                <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full progress-fill" style={{ width: `${(c.progress/c.total)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
