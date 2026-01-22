export type Tier = "free" | "basic" | "pro"

export const TIER_LIMITS: Record<Tier, number> = {
  free: 5000,
  basic: 50000,
  pro: 200000,
}

export function clampTier(input: string | null | undefined): Tier {
  if (input === "basic" || input === "pro" || input === "free") return input
  return "free"
}

export function wordCount(text: string): number {
  const t = (text ?? "").trim()
  if (!t) return 0
  return t.split(/\s+/).length
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

export function estimateCostUsd(words: number): string {
  const cost = (words / 1000) * 1.2
  return cost.toFixed(4)
}
