"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Dumbbell, Users, Trophy, Calendar } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/workouts", label: "Train", icon: Dumbbell },
  { href: "/social", label: "Community", icon: Users },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/schedule", label: "Book", icon: Calendar },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-[#1f1f1f] px-2 py-1 safe-area-pb">
      <div className="flex justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                active ? "text-green-400" : "text-gray-500"
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-green-400" : "")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
