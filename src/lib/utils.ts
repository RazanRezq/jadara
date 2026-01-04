import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Global status badge color configuration for consistent UX across the application
 * Returns color classes for applicant status badges
 */
export function getStatusBadgeColors(status: string): {
  variant: "default" | "secondary" | "destructive" | "outline"
  className: string
} {
  const statusColors: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    // New applicants - Purple/Violet (fresh, needs attention)
    new: {
      variant: "secondary",
      className: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium"
    },

    // Pending evaluation - Amber/Yellow (waiting, in-progress)
    pending: {
      variant: "secondary",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-medium"
    },

    // Evaluated - Blue (processed, reviewed)
    evaluated: {
      variant: "secondary",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium"
    },

    // Interview scheduled - Indigo (next step, important)
    interview: {
      variant: "secondary",
      className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-medium"
    },

    // Hired - Green (success, positive outcome)
    hired: {
      variant: "secondary",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-medium"
    },

    // Rejected - Red (negative outcome)
    rejected: {
      variant: "destructive",
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-medium"
    },

    // Failed - Red with higher contrast (error state)
    failed: {
      variant: "destructive",
      className: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 font-medium"
    },

    // Archived - Gray (inactive, stored)
    archived: {
      variant: "outline",
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 font-medium"
    },

    // Withdrawn - Gray (applicant withdrew)
    withdrawn: {
      variant: "outline",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 font-medium"
    },
  }

  return statusColors[status] || {
    variant: "outline" as const,
    className: "font-medium"
  }
}
