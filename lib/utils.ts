import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isToday, isYesterday, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "MMM d, yyyy")
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function computeStreak(logDates: string[]): number {
  if (!logDates.length) return 0
  const sorted = [...logDates].sort().reverse()
  const today = todayISO()
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd")

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInDays(parseISO(sorted[i - 1]), parseISO(sorted[i]))
    if (diff === 1) streak++
    else break
  }
  return streak
}

export const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-600 bg-red-50 border-red-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-green-600 bg-green-50 border-green-200",
}

export const HABIT_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  pink: "bg-pink-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
}
