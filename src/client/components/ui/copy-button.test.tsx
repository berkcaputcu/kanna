import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { CopyButton } from "./copy-button"

describe("CopyButton", () => {
  test("renders as a non-submitting button", () => {
    const html = renderToStaticMarkup(<CopyButton text="code" />)

    expect(html).toContain('type="button"')
  })
})
