// lib/auth.ts
import { APP_CONFIG, clampTier as _clampTier, type Tier, monthStart, nextMonthStart, wordCount, estimateCostUsd, getTierConfig } from "@/lib/config"

export type { Tier }

export const TIER_LIMITS: Record<Tier, number> = {
  free: APP_CONFIG.TIERS.free.monthlyWords,
  basic: APP_CONFIG.TIERS.basic.monthlyWords,
  pro: APP_CONFIG.TIERS.pro.monthlyWords,
}

export const PER_REQUEST_LIMITS: Record<Tier, number> = {
  free: APP_CONFIG.TIERS.free.perRequestWords,
  basic: APP_CONFIG.TIERS.basic.perRequestWords,
  pro: APP_CONFIG.TIERS.pro.perRequestWords,
}

export const getModelForTier = (tier: Tier) => getTierConfig(tier).model

export const clampTier = _clampTier
export { monthStart, nextMonthStart, wordCount, estimateCostUsd }
