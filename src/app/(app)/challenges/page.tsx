"use client";
import TopBar from "@/components/layout/TopBar";
import { challenges } from "@/lib/data";
import { Target, Users, Trophy, Clock, CheckCircle2, Plus, Flame, Zap } from "lucide-react";
import { useState } from "react";

export default function ChallengesPage() {
  const [joined, setJoined] = useState<string[]>(["ch1", "ch2"]);

  const toggle = (id: string) => {
    setJoined(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="animate-fade-in">
      <TopBar title="Challenges" />
      <div className="px-4 lg:px-6 py-5 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-500/20 rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-white mb-1">Level Up With Challenges</h2>
              <p className="text-sm text-gray-400">Join challenges. Build habits. Earn exclusive rewards.</p>
            </div>
            <span className="text-4xl">🏆</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-[#111111]/50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-green-400">{joined.length}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="bg-[#111111]/50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-white">142</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <div className="bg-[#111111]/50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-yellow-400">2</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Active Challenges</h3>
          <div className="space-y-4">
            {challenges.filter(c => c.active).map(c => {
              const isJoined = joined.includes(c.id);
              const pct = Math.round((c.progress / c.duration) * 100);
              return (
                <div key={c.id} className={`bg-[#111111] border rounded-2xl overflow-hidden transition-all ${isJoined ? "border-green-500/30" : "border-[#1f1f1f]"}`}>
                  {isJoined && (
                    <div className="px-4 py-1.5 bg-green-500/10 border-b border-green-500/20 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">You&apos;re in!</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{c.image}</span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white">{c.title}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{c.goal}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2 mb-3">
                          <span className="text-xs flex items-center gap-1 text-gray-400 bg-[#1a1a1a] px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />{c.duration} days
                          </span>
                          <span className="text-xs flex items-center gap-1 text-gray-400 bg-[#1a1a1a] px-2 py-1 rounded-full">
                            <Users className="w-3 h-3" />{c.enrolled} joined
                          </span>
                          <span className="text-xs flex items-center gap-1 text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-full">
                            <Trophy className="w-3 h-3" />{c.reward.split("+")[0].trim()}
                          </span>
                        </div>

                        {isJoined && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="text-white font-medium">Day {c.progress}/{c.duration}</span>
                            </div>
                            <div className="h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{pct}% complete · {c.duration - c.progress} days remaining</p>
                          </div>
                        )}

                        <button
                          onClick={() => toggle(c.id)}
                          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            isJoined
                              ? "border border-red-500/20 text-red-400 hover:bg-red-500/5"
                              : "btn-primary text-white"
                          }`}
                        >
                          {isJoined ? "Leave Challenge" : <><Plus className="w-4 h-4" /> Join Challenge</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Challenges */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Coming Soon</h3>
          <div className="space-y-3">
            {challenges.filter(c => !c.active).map(c => (
              <div key={c.id} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 flex items-center gap-4 opacity-60">
                <span className="text-3xl">{c.image}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm">{c.title}</h4>
                  <p className="text-xs text-gray-500">{c.duration} days · {c.enrolled} interested</p>
                </div>
                <button className="text-xs border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-gray-400 hover:text-green-400 hover:border-green-500/20 transition-all">
                  Notify Me
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement card */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5 mt-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Challenge Rewards
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🏆", title: "Elite Badge", desc: "Complete 30-Day Transform", earned: false },
              { icon: "❤️", title: "Cardio King", desc: "Complete 7-Day Cardio", earned: false },
              { icon: "🎁", title: "Free PT Session", desc: "Any 30-day completion", earned: false },
              { icon: "💰", title: "500 Points", desc: "Cardio Week reward", earned: false },
            ].map((r) => (
              <div key={r.title} className={`bg-[#1a1a1a] rounded-xl p-3 border ${r.earned ? "border-green-500/30" : "border-[#2a2a2a]"}`}>
                <span className="text-2xl">{r.icon}</span>
                <p className="text-sm font-semibold text-white mt-1">{r.title}</p>
                <p className="text-xs text-gray-500">{r.desc}</p>
                {r.earned && <span className="text-xs text-green-400 flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3" />Earned!</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Streak reminder */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 mt-4 flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-400 shrink-0 animate-streak" />
          <div>
            <p className="text-sm font-semibold text-white">Keep your streak alive!</p>
            <p className="text-xs text-gray-400 mt-0.5">You have a 14-day streak. Missing today would break it.</p>
          </div>
          <button className="ml-auto btn-primary px-3 py-2 rounded-xl text-xs text-white font-semibold shrink-0">
            Check In
          </button>
        </div>
      </div>
    </div>
  );
}
