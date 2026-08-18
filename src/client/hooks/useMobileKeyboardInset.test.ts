import { describe, expect, test } from "bun:test"
import { getVisualViewportBottomInset } from "./useMobileKeyboardInset"

describe("getVisualViewportBottomInset", () => {
  test("returns zero when the visual viewport reaches the container bottom", () => {
    expect(getVisualViewportBottomInset(844, { height: 844, offsetTop: 0 })).toBe(0)
  })

  test("returns the keyboard overlap when the layout viewport stays full height", () => {
    expect(getVisualViewportBottomInset(844, { height: 500, offsetTop: 0 })).toBe(344)
  })

  test("accounts for a panned visual viewport", () => {
    expect(getVisualViewportBottomInset(844, { height: 500, offsetTop: 40 })).toBe(304)
  })

  test("never returns a negative inset", () => {
    expect(getVisualViewportBottomInset(600, { height: 844, offsetTop: 0 })).toBe(0)
  })

  test("ignores invalid geometry", () => {
    expect(getVisualViewportBottomInset(Number.NaN, { height: 500, offsetTop: 0 })).toBe(0)
  })
})
