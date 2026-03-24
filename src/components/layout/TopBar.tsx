"use client";
import { Bell, Search, Zap } from "lucide-react";
import { currentUser } from "@/lib/data";
import { getInitials } from "@/lib/utils";

export default function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1f1f1f] px-4 lg:px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-green-500/30 transition-colors">
          <Search className="w-4 h-4 text-gray-400" />
        </button>
        <button className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-green-500/30 transition-colors relative">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
        </button>
        {/* Streak badge on mobile */}
        <div className="lg:hidden flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-1">
          <Zap className="w-3 h-3 text-orange-400" />
          <span className="text-xs font-bold text-orange-400">{currentUser.streak}</span>
        </div>
        <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold">
          {getInitials(currentUser.name)}
        </div>
      </div>
    </header>
  );
}
