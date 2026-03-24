"use client";
import TopBar from "@/components/layout/TopBar";
import { workouts } from "@/lib/data";
import { getDifficultyColor, getCategoryColor } from "@/lib/utils";
import { Flame, Clock, Dumbbell, Search, Filter, Play, BookOpen } from "lucide-react";
import { useState } from "react";

const categories = ["all", "strength", "cardio", "crossfit", "yoga"];
const goals = ["all", "fat_loss", "muscle_gain", "endurance", "flexibility"];
const durations = ["all", "< 30 min", "30-45 min", "45+ min"];

export default function WorkoutsPage() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [goal, setGoal] = useState("all");
  const [dur, setDur] = useState("all");
  const [selected, setSelected] = useState<typeof workouts[0] | null>(null);

  const filtered = workouts.filter(w => {
    if (search && !w.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (cat !== "all" && w.category !== cat) return false;
    if (goal !== "all" && !w.goal.includes(goal as "fat_loss" | "muscle_gain" | "endurance" | "flexibility" | "tone" | "recovery")) return false;
    if (dur !== "all") {
      if (dur === "< 30 min" && w.duration >= 30) return false;
      if (dur === "30-45 min" && (w.duration < 30 || w.duration > 45)) return false;
      if (dur === "45+ min" && w.duration <= 45) return false;
    }
    return true;
  });

  if (selected) {
    return (
      <div className="animate-fade-in">
        <TopBar title={selected.title} />
        <div className="px-4 lg:px-6 py-5 max-w-3xl mx-auto">
          <button onClick={() => setSelected(null)} className="text-sm text-green-400 hover:text-green-300 mb-4 flex items-center gap-1">
            ← Back to workouts
          </button>

          {/* Header card */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 mb-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-black text-white mb-1">{selected.title}</h1>
                <p className="text-gray-400 text-sm">by {selected.trainer}</p>
              </div>
              <div className={`text-xs px-3 py-1.5 rounded-full border capitalize ${getDifficultyColor(selected.difficulty)}`}>
                {selected.difficulty}
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-5">{selected.description}</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{selected.calories}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{selected.duration}</p>
                <p className="text-xs text-gray-500">min</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                <Dumbbell className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{selected.exercises}</p>
                <p className="text-xs text-gray-500">exercises</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mb-5">
              {selected.tags.map(tag => (
                <span key={tag} className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded-full text-gray-400">
                  #{tag}
                </span>
              ))}
            </div>
            <button className="btn-primary w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 text-base">
              <Play className="w-5 h-5" /> Start Workout
            </button>
          </div>

          {/* Exercise list */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-400" />
              Exercise List
            </h3>
            <div className="space-y-3">
              {selected.exercises_list.map((ex, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                  <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xs font-bold text-green-400 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{ex.name}</p>
                    <p className="text-xs text-gray-500">{ex.sets} sets × {ex.reps}{ex.rest ? ` · Rest: ${ex.rest}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Workouts" />
      <div className="px-4 lg:px-6 py-5 max-w-5xl mx-auto">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workouts..."
            className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Category</p>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                    cat === c ? "bg-green-500 text-white" : "bg-[#111111] border border-[#2a2a2a] text-gray-400 hover:border-green-500/30 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Goal</p>
              <div className="flex gap-2 flex-wrap">
                {goals.map(g => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                      goal === g ? "bg-blue-500/20 border border-blue-500 text-blue-400" : "bg-[#111111] border border-[#2a2a2a] text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {g.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Filter className="w-3 h-3" />
          {filtered.length} workout{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(w => (
            <div
              key={w.id}
              className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden cursor-pointer card-hover"
              onClick={() => setSelected(w)}
            >
              {/* Image placeholder */}
              <div className={`h-36 flex items-center justify-center text-5xl bg-gradient-to-br ${
                w.category === "strength" ? "from-blue-900/30 to-blue-800/10" :
                w.category === "cardio" ? "from-red-900/30 to-red-800/10" :
                w.category === "crossfit" ? "from-orange-900/30 to-orange-800/10" :
                "from-purple-900/30 to-purple-800/10"
              }`}>
                {w.category === "strength" ? "🏋️" : w.category === "cardio" ? "🏃" : w.category === "crossfit" ? "⚡" : "🧘"}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{w.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">by {w.trainer}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${getCategoryColor(w.category)}`}>{w.category}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${getDifficultyColor(w.difficulty)}`}>{w.difficulty}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{w.calories} kcal</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{w.duration} min</span>
                  <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{w.exercises}ex</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No workouts found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
