import { describe, expect, test } from "bun:test"
import { getMobileKeyboardScrollDelta, getVisualViewportBottomInset } from "./useMobileKeyboardInset"

describe("getVisualViewportBottomInset", () => {
  test("returns zero when the visual viewport reaches the container bottom", () => {
    expect(getVisualViewportBottomInset(844, { height: 844, offsetTop: 0 })).toBe(0)
  })

  test("returns the keyboard overlap when the layout viewport stays full height", () => {
    expect(getVisualViewportBottomInset(844, { height: 500, offsetTop: 0 })).toBe(344)
  })

  test("accounts for a panned visual viewport", () => {
    expect(getVisualViewportBottomInset(844, { height: 500, offsetTop: 40 })).toBe(344)
  })

  test("never returns a negative inset", () => {
    expect(getVisualViewportBottomInset(600, { height: 844, offsetTop: 0 })).toBe(0)
  })

  test("ignores invalid geometry", () => {
    expect(getVisualViewportBottomInset(Number.NaN, { height: 500, offsetTop: 0 })).toBe(0)
  })
})

describe("getMobileKeyboardScrollDelta", () => {
  test("moves the transcript by the composer top edge movement", () => {
    expect(getMobileKeyboardScrollDelta(600, 256)).toBe(344)
  })

  test("restores the transcript offset as the keyboard closes", () => {
    expect(getMobileKeyboardScrollDelta(256, 600)).toBe(-344)
  })

  test("ignores invalid insets", () => {
    expect(getMobileKeyboardScrollDelta(Number.NaN, 344)).toBe(0)
  })
})
