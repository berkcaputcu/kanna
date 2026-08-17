import { describe, expect, test } from "bun:test"
import { calculateUsageForecast } from "./usageForecast"

const NOW = new Date("2026-08-16T12:00:00.000Z")

describe("calculateUsageForecast", () => {
  test("projects usage at the current pace and marks the on-pace target", () => {
    const result = calculateUsageForecast(
      {
        usedPercent: 25,
        windowMinutes: 300,
        resetsAt: "2026-08-16T14:00:00.000Z",
      },
      NOW,
    )

    expect(result).toEqual({
      usedPercent: 25,
      predictedFinalPercent: 41.7,
      optimizedTargetPercent: 60,
      remainingText: "2h 0m",
      paceRateText: "8.3%/h",
      tone: "safe",
    })
  })

  test("marks an overrun prediction as critical", () => {
    const result = calculateUsageForecast(
      {
        usedPercent: 80,
        windowMinutes: 10_080,
        resetsAt: "2026-08-19T12:00:00.000Z",
      },
      NOW,
    )

    expect(result?.predictedFinalPercent).toBe(140)
    expect(result?.optimizedTargetPercent).toBe(57.1)
    expect(result?.tone).toBe("critical")
    expect(result?.remainingText).toBe("3d 0h 0m")
    expect(result?.paceRateText).toBe("20.0%/d")
  })

  test("returns no forecast when the provider does not report a complete window", () => {
    expect(
      calculateUsageForecast({ usedPercent: 20, windowMinutes: null, resetsAt: "2026-08-17T12:00:00.000Z" }, NOW),
    ).toBeNull()
    expect(
      calculateUsageForecast({ usedPercent: null, windowMinutes: 300, resetsAt: "2026-08-16T14:00:00.000Z" }, NOW),
    ).toBeNull()
  })
})
