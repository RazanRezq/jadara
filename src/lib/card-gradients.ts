/**
 * Card gradient color schemes for MagicCard component
 * Used to maintain consistent theming across the application
 */

export const cardGradients = {
  // Primary gradients
  primary: {
    from: "#4f46e5", // Indigo
    to: "#7c3aed",   // Purple
  },

  // Dashboard sections
  applicants: {
    from: "#14b8a6", // Teal
    to: "#06b6d4",   // Cyan
  },

  jobs: {
    from: "#3b82f6", // Blue
    to: "#6366f1",   // Indigo
  },

  interviews: {
    from: "#9333ea", // Purple
    to: "#a855f7",   // Purple-light
  },

  success: {
    from: "#10b981", // Emerald
    to: "#14b8a6",   // Teal
  },

  warning: {
    from: "#f59e0b", // Amber
    to: "#f97316",   // Orange
  },

  danger: {
    from: "#ef4444", // Red
    to: "#dc2626",   // Red-dark
  },

  // Feature-specific
  settings: {
    from: "#64748b", // Slate
    to: "#94a3b8",   // Slate-light
  },

  analytics: {
    from: "#8b5cf6", // Violet
    to: "#c026d3",   // Fuchsia
  },

  users: {
    from: "#06b6d4", // Cyan
    to: "#0ea5e9",   // Sky
  },

  reviews: {
    from: "#f97316", // Orange
    to: "#fb923c",   // Orange-light
  },

  // Neutral
  neutral: {
    from: "#71717a", // Zinc
    to: "#a1a1aa",   // Zinc-light
  },

  dark: {
    from: "#374151", // Gray-700
    to: "#4b5563",   // Gray-600
  },
} as const

export type CardGradientKey = keyof typeof cardGradients

/**
 * Get gradient colors for a specific card type
 */
export function getCardGradient(key: CardGradientKey = "primary") {
  return cardGradients[key]
}

/**
 * Get all gradient values as a flat array for random selection
 */
export function getRandomGradient() {
  const keys = Object.keys(cardGradients) as CardGradientKey[]
  const randomKey = keys[Math.floor(Math.random() * keys.length)]
  return cardGradients[randomKey]
}
