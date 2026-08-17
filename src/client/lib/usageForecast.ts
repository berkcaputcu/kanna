import type { UsageLimitWindow } from "../../shared/types"

export type UsageForecastTone = "safe" | "warn" | "critical"

export interface UsageForecastMetrics {
  usedPercent: number
  predictedFinalPercent: number
  optimizedTargetPercent: number
  remainingText: string
  paceRateText: string
  tone: UsageForecastTone
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000))
  if (totalMinutes < 1) return "<1m"

  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function displayPercent(value: number): number {
  return Number(value.toFixed(1))
}

export function calculateUsageForecast(
  window: Pick<UsageLimitWindow, "usedPercent" | "windowMinutes" | "resetsAt">,
  now: Date = new Date(),
): UsageForecastMetrics | null {
  if (
    window.usedPercent === null ||
    !Number.isFinite(window.usedPercent) ||
    window.windowMinutes === null ||
    !Number.isFinite(window.windowMinutes) ||
    window.windowMinutes <= 0 ||
    !window.resetsAt
  ) {
    return null
  }

  const resetMs = Date.parse(window.resetsAt)
  if (!Number.isFinite(resetMs)) return null

  const usedPercent = window.usedPercent
  const windowSeconds = window.windowMinutes * 60
  const remainingSeconds = Math.max(0, (resetMs - now.getTime()) / 1000)
  const elapsedSeconds = clamp(windowSeconds - remainingSeconds, 0, windowSeconds)
  const elapsedRatio = elapsedSeconds / windowSeconds
  const usageRatio = usedPercent / 100
  const predictedFinalPercent =
    elapsedRatio >= 0.01 ? Math.min((usageRatio / elapsedRatio) * 100, 999) : usedPercent
  const optimizedTargetPercent = clamp(elapsedRatio * 100, 0, 100)

  const useHours = windowSeconds < 5 * 24 * 60 * 60
  const elapsedUnits = Math.max(elapsedSeconds / (useHours ? 3600 : 86400), 0.01)

  return {
    usedPercent,
    predictedFinalPercent: displayPercent(predictedFinalPercent),
    optimizedTargetPercent: displayPercent(optimizedTargetPercent),
    remainingText: formatDuration(remainingSeconds * 1000),
    paceRateText: `${(usedPercent / elapsedUnits).toFixed(1)}%/${useHours ? "h" : "d"}`,
    tone:
      usedPercent >= 90 || predictedFinalPercent > 100
        ? "critical"
        : usedPercent >= 70
          ? "warn"
          : "safe",
  }
}

