"use client";
import TopBar from "@/components/layout/TopBar";
import { classes, trainers } from "@/lib/data";
import { Clock, Users, Calendar, CheckCircle2, Star, ChevronRight } from "lucide-react";
import { getCategoryColor } from "@/lib/utils";
import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [24, 25, 26, 27, 28, 29, 30];

export default function SchedulePage() {
  const [activeDay, setActiveDay] = useState(0);
  const [booked, setBooked] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"classes" | "trainers">("classes");

  const book = (id: string) => {
    setBooked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="animate-fade-in">
      <TopBar title="Schedule" />
      <div className="px-4 lg:px-6 py-5 max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1">
          {(["classes", "trainers"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-green-500/10 text-green-400 border border-green-500/20" : "text-gray-500 hover:text-gray-300"}`}
            >
              {tab === "classes" ? "Classes" : "Personal Training"}
            </button>
          ))}
        </div>

        {activeTab === "classes" && (
          <>
            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => setActiveDay(i)}
                  className={`shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl transition-all ${
                    activeDay === i ? "bg-green-500 text-white" : "bg-[#111111] border border-[#1f1f1f] text-gray-400 hover:border-green-500/30"
                  }`}
                >
                  <span className="text-[10px] font-medium">{d}</span>
                  <span className="text-base font-black">{DATES[i]}</span>
                </button>
              ))}
            </div>

            {/* Classes */}
            <div className="space-y-3">
              {classes.map(cls => {
                const isBooked = booked.includes(cls.id);
                const isFull = cls.spots === 0;
                const spotsPct = ((cls.capacity - cls.spots) / cls.capacity) * 100;
                return (
                  <div key={cls.id} className={`bg-[#111111] border rounded-2xl p-4 transition-all ${isBooked ? "border-green-500/30" : "border-[#1f1f1f]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm">{cls.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${getCategoryColor(cls.category)}`}>{cls.category}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">with {cls.trainer}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.time} · {cls.duration}min</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cls.date}</span>
                          <span className={`flex items-center gap-1 ${cls.spots <= 3 ? "text-red-400" : ""}`}>
                            <Users className="w-3 h-3" />{cls.spots} spots left
                          </span>
                        </div>
                        {/* Capacity bar */}
                        <div className="mt-2 h-1 bg-[#1f1f1f] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${spotsPct > 80 ? "bg-red-500" : spotsPct > 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${spotsPct}%` }} />
                        </div>
                      </div>
                      <button
                        onClick={() => !isFull && book(cls.id)}
                        disabled={isFull && !isBooked}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isBooked ? "bg-green-500/10 border border-green-500/30 text-green-400" :
                          isFull ? "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-600 cursor-not-allowed" :
                          "btn-primary text-white"
                        }`}
                      >
                        {isBooked ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />Booked</> : isFull ? "Full" : "Book"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "trainers" && (
          <div className="space-y-4">
            {trainers.map(t => (
              <div key={t.id} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5 card-hover">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-lg font-black text-white">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#111111] ${t.available ? "bg-green-500" : "bg-gray-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white">{t.name}</h4>
                        <p className="text-xs text-green-400">{t.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs font-semibold shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        {t.rating}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{t.bio}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span>{t.experience} exp.</span>
                      <span>·</span>
                      <span>{t.clients} active clients</span>
                      <span>·</span>
                      <span>{t.reviews} reviews</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          t.available
                            ? "btn-primary text-white"
                            : "border border-[#2a2a2a] text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {t.available ? "Book Session" : "Unavailable"}
                      </button>
                      <button className="px-4 py-2 rounded-xl text-xs border border-[#2a2a2a] text-gray-400 hover:border-green-500/30 hover:text-green-400 transition-all flex items-center gap-1">
                        Profile <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
