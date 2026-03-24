"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials, getLevelTitle } from "@/lib/utils";
import { currentUser } from "@/lib/data";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  Trophy,
  Calendar,
  Apple,
  MessageSquare,
  Target,
  QrCode,
  Settings,
  Zap,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/social", label: "Community", icon: Users },
  { href: "/nutrition", label: "Nutrition", icon: Apple },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/challenges", label: "Challenges", icon: Target },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/checkin", label: "Check In", icon: QrCode },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#111111] border-r border-[#1f1f1f] h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1f1f1f]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            AFIT <span className="gradient-text">Studios</span>
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a]">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-sm font-bold text-white">
              {getInitials(currentUser.name)}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a1a] text-[8px] flex items-center justify-center font-bold text-white">
              {currentUser.level}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-400">{getLevelTitle(currentUser.level)}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs font-medium text-orange-400">
            <Zap className="w-3 h-3" />
            {currentUser.streak}
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="px-4 py-3 border-b border-[#1f1f1f]">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Level {currentUser.level}</span>
          <span>{currentUser.xp}/{currentUser.xpToNext} XP</span>
        </div>
        <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full progress-fill"
            style={{ width: `${(currentUser.xp / currentUser.xpToNext) * 100}%` }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-green-400" : "")} />
              {label}
              {label === "Messages" && (
                <span className="ml-auto bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 py-3 border-t border-[#1f1f1f]">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
