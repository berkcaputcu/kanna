import { useEffect, useState } from "react"
import type { UsageLimitWindow } from "../../shared/types"
import { calculateUsageForecast, type UsageForecastMetrics, type UsageForecastTone } from "../lib/usageForecast"
import { cn } from "../lib/utils"

const TONE_CLASSES: Record<UsageForecastTone, { fill: string; marker: string }> = {
  safe: { fill: "bg-emerald-500", marker: "bg-emerald-300" },
  warn: { fill: "bg-amber-500", marker: "bg-amber-300" },
  critical: { fill: "bg-red-500", marker: "bg-red-300" },
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function ForecastWindow({ window, metrics }: { window: UsageLimitWindow; metrics: UsageForecastMetrics }) {
  const colors = TONE_CLASSES[metrics.tone]
  const usedWidth = Math.max(metrics.usedPercent > 0 ? 1.5 : 0, Math.min(100, metrics.usedPercent))

  return (
    <div className="rounded-xl border border-border/70 bg-background/35 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-xs font-medium text-foreground">{window.label}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          Used <span className="font-medium tabular-nums text-foreground">{formatPercent(metrics.usedPercent)}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2.5 rounded-full border border-border bg-muted/60">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out", colors.fill)}
          style={{ width: `${usedWidth}%` }}
        />
        <div
          className={cn("absolute -top-1 h-4 w-0.5 rounded-full transition-[left] duration-500 ease-out", colors.marker)}
          style={{ left: `${metrics.optimizedTargetPercent}%` }}
          title={`On pace: ${formatPercent(metrics.optimizedTargetPercent)} by now`}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3 text-[11px] text-muted-foreground">
        <span>
          Predicted <span className="font-medium tabular-nums text-foreground">{formatPercent(metrics.predictedFinalPercent)}</span>
        </span>
        <span className="shrink-0">{metrics.remainingText} left</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">Pace {metrics.paceRateText}</div>
    </div>
  )
}

export function UsageForecast({ windows }: { windows: UsageLimitWindow[] }) {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const forecastWindows = windows.flatMap((window) => {
    const metrics = calculateUsageForecast(window, new Date(nowMs))
    return metrics ? [{ window, metrics }] : []
  })

  if (forecastWindows.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-3">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold text-foreground">Projected usage</span>
        <span className="text-[10px] text-muted-foreground">at current pace</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {forecastWindows.map(({ window, metrics }) => (
          <ForecastWindow key={window.id} window={window} metrics={metrics} />
        ))}
      </div>
    </div>
  )
}
