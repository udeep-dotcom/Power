"use client";
import { Bell, Droplets } from "lucide-react";
import { currentUser, alerts } from "@/lib/data";

export default function TopBar({ title }: { title: string }) {
  const unresolved = alerts.filter(a => !a.resolved).length;
  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1a]/85 backdrop-blur-md border-b border-[#1e3a5f] px-4 lg:px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-xl bg-[#162035] border border-[#1e3a5f] flex items-center justify-center hover:border-blue-500/30 transition-colors relative">
          <Bell className="w-4 h-4 text-gray-400" />
          {unresolved > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">
              {unresolved}
            </span>
          )}
        </button>
        {/* Mobile branding */}
        <div className="lg:hidden flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1">
          <Droplets className="w-3 h-3 text-blue-400" />
          <span className="text-xs font-bold text-blue-400">HydroTrack</span>
        </div>
        <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-xs font-bold">
          {currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
      </div>
    </header>
  );
}
