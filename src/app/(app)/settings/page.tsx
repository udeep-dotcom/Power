"use client";
import TopBar from "@/components/layout/TopBar";
import { currentUser } from "@/lib/data";
import { getInitials } from "@/lib/utils";
import { Bell, Shield, User, LogOut, Moon, Smartphone, Globe, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    streakAlerts: true,
    workoutReminders: true,
    communityActivity: true,
    trainerMessages: true,
    challenges: false,
  });
  const [darkMode, setDarkMode] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="transition-colors">
      {on
        ? <ToggleRight className="w-8 h-8 text-green-400" />
        : <ToggleLeft className="w-8 h-8 text-gray-600" />
      }
    </button>
  );

  return (
    <div className="animate-fade-in">
      <TopBar title="Settings" />
      <div className="px-4 lg:px-6 py-5 max-w-2xl mx-auto space-y-5">
        {/* Profile section */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-green-400" />
            Account
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-lg font-bold">
              {getInitials(currentUser.name)}
            </div>
            <div>
              <p className="font-semibold text-white">{currentUser.name}</p>
              <p className="text-sm text-gray-400">{currentUser.email}</p>
              <p className="text-xs text-green-400">Level {currentUser.level} Member</p>
            </div>
          </div>
          <button className="w-full py-2.5 rounded-xl border border-[#2a2a2a] text-sm text-gray-300 hover:border-green-500/30 hover:text-green-400 transition-all font-medium">
            Edit Profile
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-green-400" />
            Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
              <div>
                <p className="text-sm font-medium text-white">Push Notifications</p>
                <p className="text-xs text-gray-500">Enable all push notifications</p>
              </div>
              <Toggle on={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />
            </div>
            {Object.entries(notifications).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                <div>
                  <p className="text-sm text-white capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                </div>
                <Toggle
                  on={val}
                  onToggle={() => setNotifications(prev => ({ ...prev, [key]: !val }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Moon className="w-4 h-4 text-green-400" />
            Appearance
          </h3>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-white">Dark Mode</p>
              <p className="text-xs text-gray-500">Always on for premium look</p>
            </div>
            <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            Privacy & Security
          </h3>
          <div className="space-y-1">
            {[
              "Change Password",
              "Two-Factor Authentication",
              "Privacy Settings",
              "Data Export",
              "Connected Devices",
            ].map(item => (
              <button key={item} className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors">
                <span className="text-sm text-gray-300">{item}</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>
        </div>

        {/* App settings */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-green-400" />
            App
          </h3>
          <div className="space-y-1">
            {[
              { label: "Language", value: "English" },
              { label: "Units", value: "Metric (kg, cm)" },
              { label: "App Version", value: "1.0.0" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors">
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className="text-xs text-gray-500">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button className="w-full py-3.5 rounded-xl border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        <p className="text-center text-xs text-gray-600 pb-4">AFIT Studios v1.0.0 · © 2026</p>
      </div>
    </div>
  );
}
