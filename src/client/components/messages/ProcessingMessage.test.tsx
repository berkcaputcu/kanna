import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { ProcessingMessage } from "./ProcessingMessage"

describe("ProcessingMessage", () => {
  test("combines the processing status and live duration into one label", () => {
    const html = renderToStaticMarkup(
      <ProcessingMessage status="running" startedAt={Date.now() - 61_000} />
    )

    expect(html).toContain("Running for 1m 1s...")
  })

  test("does not show a duration when no start time is available", () => {
    const html = renderToStaticMarkup(<ProcessingMessage status="starting" />)

    expect(html).toContain("Starting...")
    expect(html).not.toContain("Running for")
  })
})
