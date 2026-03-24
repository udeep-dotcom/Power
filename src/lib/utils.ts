import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLevelTitle(level: number): string {
  if (level < 5) return "Recruit";
  if (level < 10) return "Athlete";
  if (level < 15) return "Warrior";
  if (level < 20) return "Champion";
  if (level < 25) return "Legend";
  return "Elite";
}

export function getLevelColor(level: number): string {
  if (level < 5) return "text-gray-400";
  if (level < 10) return "text-green-400";
  if (level < 15) return "text-blue-400";
  if (level < 20) return "text-purple-400";
  if (level < 25) return "text-yellow-400";
  return "text-red-400";
}

export function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "beginner": return "text-green-400 bg-green-400/10";
    case "intermediate": return "text-yellow-400 bg-yellow-400/10";
    case "advanced": return "text-red-400 bg-red-400/10";
    default: return "text-gray-400 bg-gray-400/10";
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "strength": return "text-blue-400 bg-blue-400/10";
    case "cardio": return "text-red-400 bg-red-400/10";
    case "crossfit": return "text-orange-400 bg-orange-400/10";
    case "yoga": return "text-purple-400 bg-purple-400/10";
    case "boxing": return "text-yellow-400 bg-yellow-400/10";
    default: return "text-gray-400 bg-gray-400/10";
  }
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function calculateMacroCalories(protein: number, carbs: number, fat: number): number {
  return protein * 4 + carbs * 4 + fat * 9;
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "🔥🔥🔥";
  if (streak >= 14) return "🔥🔥";
  if (streak >= 7) return "🔥";
  if (streak >= 3) return "⚡";
  return "💪";
}
