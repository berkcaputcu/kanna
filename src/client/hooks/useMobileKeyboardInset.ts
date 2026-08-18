import { useEffect, useState, type RefObject } from "react"

export interface VisualViewportGeometry {
  height: number
  offsetTop: number
}

/**
 * Returns the part of a layout-viewport container covered by the visual
 * viewport's bottom edge. Mobile keyboards usually resize the visual viewport
 * while leaving the layout viewport (and this app's absolute composer) alone.
 */
export function getVisualViewportBottomInset(containerBottom: number, viewport: VisualViewportGeometry) {
  if (!Number.isFinite(containerBottom) || !Number.isFinite(viewport.height) || !Number.isFinite(viewport.offsetTop)) {
    return 0
  }

  const visibleBottom = viewport.offsetTop + viewport.height
  return Math.max(0, Math.round(containerBottom - visibleBottom))
}

export function getMobileKeyboardScrollDelta(previousInset: number, nextInset: number) {
  if (!Number.isFinite(previousInset) || !Number.isFinite(nextInset)) return 0
  return nextInset - previousInset
}

/**
 * Tracks the visual viewport while the chat input owns focus. The input and
 * chat card are siblings of the transcript scroller, so scrolling the
 * transcript cannot reveal an input hidden by an on-screen keyboard. Moving
 * the dock by the measured overlap is reliable across browsers that resize
 * the layout viewport and browsers that keep the keyboard as an overlay.
 */
export function useMobileKeyboardInset(
  containerRef: RefObject<HTMLElement | null>,
  inputRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setInset((current) => (current === 0 ? current : 0))
      return
    }

    const viewport = window.visualViewport
    if (!viewport) return

    let frameId = 0

    const sync = () => {
      if (frameId !== 0) cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        frameId = 0

        const container = containerRef.current
        const input = inputRef.current
        if (!container || !input || document.activeElement !== input) {
          setInset((current) => (current === 0 ? current : 0))
          return
        }

        const nextInset = getVisualViewportBottomInset(container.getBoundingClientRect().bottom, viewport)
        setInset((current) => (current === nextInset ? current : nextInset))
      })
    }

    viewport.addEventListener("resize", sync)
    viewport.addEventListener("scroll", sync)
    window.addEventListener("resize", sync)
    document.addEventListener("focusin", sync)
    document.addEventListener("focusout", sync)
    sync()

    return () => {
      if (frameId !== 0) cancelAnimationFrame(frameId)
      viewport.removeEventListener("resize", sync)
      viewport.removeEventListener("scroll", sync)
      window.removeEventListener("resize", sync)
      document.removeEventListener("focusin", sync)
      document.removeEventListener("focusout", sync)
    }
  }, [containerRef, enabled, inputRef])

  return inset
}
