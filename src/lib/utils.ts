import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMWh(mwh: number): string {
  if (mwh >= 1_000_000) return `${(mwh / 1_000_000).toFixed(2)} TWh`;
  if (mwh >= 1_000) return `${(mwh / 1_000).toFixed(2)} GWh`;
  return `${mwh.toFixed(0)} MWh`;
}

export function formatNPR(amount: number): string {
  if (amount >= 1_000_000_000) return `NPR ${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `NPR ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `NPR ${(amount / 1_000).toFixed(0)}K`;
  return `NPR ${amount.toFixed(0)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical": return "text-red-400 bg-red-500/10 border-red-500/20";
    case "warning": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "info": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "resolved": return "text-green-400 bg-green-500/10 border-green-500/20";
    default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "operational": return "text-green-400 bg-green-500/10 border-green-500/20";
    case "under-maintenance": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "offline": return "text-red-400 bg-red-500/10 border-red-500/20";
    default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
}

export function getPLFColor(plf: number): string {
  if (plf >= 70) return "text-green-400";
  if (plf >= 50) return "text-blue-400";
  if (plf >= 30) return "text-amber-400";
  return "text-red-400";
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function isSeason(month: number): "wet" | "dry" {
  return month >= 6 && month <= 11 ? "wet" : "dry";
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" });
}
