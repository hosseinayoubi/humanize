// lib/config.ts
export type Tier = "free" | "basic" | "pro"

export const APP_CONFIG = {
  TIERS: {
    free: {
      monthlyWords: 5000,
      perRequestWords: 500,
      model: "claude-3-haiku-20240307",
    },
    basic: {
      monthlyWords: 50000,
      perRequestWords: 2000,
      model: "claude-3-sonnet-20240229",
    },
    pro: {
      monthlyWords: 200000,
      perRequestWords: 5000,
      model: "claude-sonnet-4-5-20250929",
    },
  },
  PRICING: {
    COST_PER_1000_WORDS_USD: 1.2,
  },
  API: {
    HUMANIZE_TIMEOUT_MS: 35000,
    MAX_CONCURRENT_REQUESTS: 2,
  },
} as const

export function clampTier(input: any): Tier {
  return input === "free" || input === "basic" || input === "pro" ? input : "free"
}

export function getTierConfig(tier: Tier) {
  return APP_CONFIG.TIERS[tier] ?? APP_CONFIG.TIERS.free
}

export function estimateCostUsd(words: number): number {
  const cost = (words / 1000) * APP_CONFIG.PRICING.COST_PER_1000_WORDS_USD
  return Math.round(cost * 10000) / 10000
}

export function wordCount(text: string): number {
  const t = (text ?? "").trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

export function monthStart(d = new Date()) {
  const m = new Date(d)
  m.setDate(1)
  m.setHours(0, 0, 0, 0)
  return m
}

export function nextMonthStart(d = new Date()) {
  const m = monthStart(d)
  m.setMonth(m.getMonth() + 1)
  return m
}
