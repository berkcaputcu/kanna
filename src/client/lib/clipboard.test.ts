import { afterEach, describe, expect, test } from "bun:test"
import { copyTextToClipboard } from "./clipboard"

const originalNavigator = globalThis.navigator
const originalDocument = globalThis.document

afterEach(() => {
  globalThis.navigator = originalNavigator
  globalThis.document = originalDocument
})

describe("copyTextToClipboard", () => {
  test("uses the async clipboard API when it succeeds", async () => {
    let copiedText = ""
    globalThis.navigator = {
      clipboard: {
        writeText: async (text: string) => {
          copiedText = text
        },
      },
    } as Navigator

    expect(await copyTextToClipboard("hello")).toBe(true)
    expect(copiedText).toBe("hello")
  })

  test("falls back to the selection copy path when the async API rejects", async () => {
    let copiedText = ""
    let execCommandCalled = false
    const helper = {
      value: "",
      style: {} as Record<string, string>,
      setAttribute: () => {},
      focus: () => {},
      select: () => {
        copiedText = helper.value
      },
      setSelectionRange: () => {},
      remove: () => {},
    }

    globalThis.navigator = {
      clipboard: {
        writeText: async () => {
          throw new Error("clipboard unavailable")
        },
      },
    } as Navigator
    globalThis.document = {
      createElement: () => helper,
      body: { appendChild: () => {} },
      execCommand: (command: string) => {
        execCommandCalled = command === "copy"
        return true
      },
    } as unknown as Document

    expect(await copyTextToClipboard("fallback text")).toBe(true)
    expect(copiedText).toBe("fallback text")
    expect(execCommandCalled).toBe(true)
  })
})
