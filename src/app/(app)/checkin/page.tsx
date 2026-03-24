"use client";
import TopBar from "@/components/layout/TopBar";
import { currentUser } from "@/lib/data";
import { QrCode, CheckCircle2, Flame, Calendar, MapPin, Zap } from "lucide-react";
import { useState } from "react";

const recentCheckins = [
  { date: "Today, 7:15 AM", location: "AFIT Studios Main", points: 50 },
  { date: "Yesterday, 6:45 AM", location: "AFIT Studios Main", points: 50 },
  { date: "Sun, 8:00 AM", location: "AFIT Studios Main", points: 50 },
  { date: "Fri, 6:30 PM", location: "AFIT Studios Downtown", points: 50 },
  { date: "Thu, 7:00 AM", location: "AFIT Studios Main", points: 50 },
];

export default function CheckInPage() {
  const [checked, setChecked] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleManualCheckin = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setChecked(true);
    }, 1500);
  };

  return (
    <div className="animate-fade-in">
      <TopBar title="Check In" />
      <div className="px-4 lg:px-6 py-5 max-w-md mx-auto">
        {/* Main check-in card */}
        {!checked ? (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 text-center mb-5">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border-2 border-dashed border-green-500/40 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Check In to AFIT Studios</h2>
            <p className="text-sm text-gray-400 mb-6">Scan the QR code at the gym entrance or check in manually</p>

            <button
              onClick={handleManualCheckin}
              disabled={scanning}
              className="btn-primary w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 mb-3"
            >
              {scanning ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking in...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Manual Check In</>
              )}
            </button>

            <p className="text-xs text-gray-500">Or scan QR code at the entrance turnstile</p>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center mb-5 animate-slide-up">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-black text-white mb-1">Checked In!</h2>
            <p className="text-sm text-gray-400 mb-3">Welcome to AFIT Studios</p>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-green-400 font-semibold mb-4">
              <Zap className="w-4 h-4" />
              +50 points earned
            </div>
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <Flame className="w-5 h-5 animate-streak" />
              <span className="font-bold">{currentUser.streak + 1}-day streak!</span>
            </div>
          </div>
        )}

        {/* Streak info */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Streak Progress</h3>
            <div className="flex items-center gap-1.5 text-orange-400 font-bold">
              <Flame className="w-4 h-4 animate-streak" />
              {currentUser.streak} days
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {Array.from({ length: 14 }).map((_, i) => {
              const isChecked = i < currentUser.streak % 14;
              const isToday = i === currentUser.streak % 14;
              return (
                <div key={i} className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isChecked ? "bg-green-500 text-white" :
                  isToday && checked ? "bg-green-500 text-white" :
                  isToday ? "border-2 border-dashed border-green-500/40 text-gray-600" :
                  "bg-[#1a1a1a] text-gray-700"
                }`}>
                  {isChecked || (isToday && checked) ? "✓" : "·"}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Longest: {currentUser.longestStreak} days</span>
            <span>Avg/week: {currentUser.stats.avgWeeklyCheckins}x</span>
          </div>
        </div>

        {/* Monthly calendar */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5 mb-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-400" />
            March 2026
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={i} className="text-[10px] text-gray-500 pb-1">{d}</div>
            ))}
            {/* Empty cells for month start */}
            {[...Array(6)].map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: 24 }, (_, i) => i + 1).map(day => {
              const checkedDays = [3, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 21, 24];
              const isToday = day === 24;
              const isChecked = checkedDays.includes(day);
              return (
                <div key={day} className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center text-[11px] font-medium ${
                  isToday && checked ? "bg-green-500 text-white font-bold" :
                  isToday ? "border-2 border-green-500 text-green-400" :
                  isChecked ? "bg-green-500/20 text-green-400" :
                  "text-gray-500"
                }`}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500/20 rounded-full inline-block" />Checked in</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-green-500 rounded-full inline-block" />Today</span>
          </div>
        </div>

        {/* Recent check-ins */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Recent Check-ins</h3>
          <div className="space-y-3">
            {recentCheckins.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
                <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{c.date}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{c.location}
                  </p>
                </div>
                <span className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />+{c.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
