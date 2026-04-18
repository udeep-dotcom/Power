"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Zap, TrendingUp, Bell, FolderOpen } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/generation", label: "Generation", icon: Zap },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f1929] border-t border-[#1e3a5f] px-2 py-1">
      <div className="flex justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                active ? "text-blue-400" : "text-gray-500"
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-blue-400" : "")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
