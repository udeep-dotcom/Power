"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/data";
import {
  LayoutDashboard,
  Zap,
  FolderOpen,
  BarChart3,
  TrendingUp,
  FileUp,
  FileText,
  Bell,
  Wrench,
  Settings,
  Droplets,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/generation", label: "Generation Log", icon: Zap },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/import", label: "Import Data", icon: FileUp },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0f1929] border-r border-[#1e3a5f] h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1e3a5f]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Hydro<span className="gradient-text">Track</span>
          </span>
        </Link>
        <p className="text-xs text-gray-500 mt-1 ml-10">Nepal</p>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-[#1e3a5f]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#162035]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-sm font-bold text-white">
            {currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-blue-400">{currentUser.role}</p>
          </div>
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
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-[#162035]"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-blue-400" : "")} />
              {label}
              {label === "Alerts" && (
                <span className="ml-auto bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  5
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Company & Settings */}
      <div className="px-3 py-3 border-t border-[#1e3a5f] space-y-1">
        <div className="px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
          <p className="text-xs text-gray-500">Company</p>
          <p className="text-xs font-medium text-gray-300 truncate">{currentUser.company}</p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#162035] transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
