import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { ProcessingMessage } from "./ProcessingMessage"

describe("ProcessingMessage", () => {
  test("shows the live duration beside the processing status", () => {
    const html = renderToStaticMarkup(
      <ProcessingMessage status="running" startedAt={Date.now() - 61_000} />
    )

    expect(html).toContain("Running...")
    expect(html).toContain("Running for 1m 1s")
  })

  test("does not show a duration when no start time is available", () => {
    const html = renderToStaticMarkup(<ProcessingMessage status="starting" />)

    expect(html).toContain("Starting...")
    expect(html).not.toContain("Running for")
  })
})
