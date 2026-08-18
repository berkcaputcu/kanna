import { afterEach, describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import {
  ChangelogSection,
  fetchGithubReleases,
  formatPublishedDate,
  getCachedChangelog,
  getKeybindingsSubtitle,
  loadChangelog,
  resetSettingsPageChangelogCache,
  resolveSettingsSectionId,
  setCachedChangelog,
  shouldPreviewChatSoundChange,
  SkillsSection,
} from "./SettingsPage"

const SAMPLE_RELEASES = [
  {
    id: 1,
    name: "v0.8.1",
    tag_name: "v0.8.1",
    html_url: "https://github.com/jakemor/kanna/releases/tag/v0.8.1",
    published_at: "2026-03-19T16:53:08Z",
    body: "## Improvements\n- Better cursor color",
    prerelease: false,
    draft: false,
  },
  {
    id: 2,
    name: null,
    tag_name: "v0.9.0-beta.1",
    html_url: "https://github.com/jakemor/kanna/releases/tag/v0.9.0-beta.1",
    published_at: "2026-03-20T12:00:00Z",
    body: "",
    prerelease: true,
    draft: false,
  },
]

afterEach(() => {
  resetSettingsPageChangelogCache()
})

describe("fetchGithubReleases", () => {
  test("filters draft releases and sends the GitHub accept header", async () => {
    let requestedUrl = ""
    let requestedAcceptHeader = ""

    const releases = await fetchGithubReleases(async (input, init) => {
      requestedUrl = String(input)
      requestedAcceptHeader = String(new Headers(init?.headers).get("Accept"))

      return new Response(JSON.stringify([
        SAMPLE_RELEASES[0],
        { ...SAMPLE_RELEASES[1], draft: true },
      ]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    })

    expect(requestedUrl).toBe("https://api.github.com/repos/jakemor/kanna/releases")
    expect(requestedAcceptHeader).toBe("application/vnd.github+json")
    expect(releases).toEqual([SAMPLE_RELEASES[0]])
  })

  test("throws on non-200 responses", async () => {
    await expect(fetchGithubReleases(async () => new Response("nope", { status: 403 }))).rejects.toThrow(
      "GitHub releases request failed with status 403"
    )
  })
})

describe("changelog cache", () => {
  test("reuses cached releases inside the ttl window", () => {
    const originalNow = Date.now
    Date.now = () => 1_000

    setCachedChangelog([SAMPLE_RELEASES[0]])
    expect(getCachedChangelog()).toEqual([SAMPLE_RELEASES[0]])

    Date.now = () => 1_000 + 4 * 60 * 1000
    expect(getCachedChangelog()).toEqual([SAMPLE_RELEASES[0]])

    Date.now = originalNow
  })

  test("expires cached releases after the ttl window", () => {
    const originalNow = Date.now
    Date.now = () => 2_000

    setCachedChangelog([SAMPLE_RELEASES[0]])
    Date.now = () => 2_000 + 5 * 60 * 1000 + 1

    expect(getCachedChangelog()).toBeNull()

    Date.now = originalNow
  })

  test("force refresh bypasses the in-memory cache", async () => {
    setCachedChangelog([SAMPLE_RELEASES[0]])

    const releases = await loadChangelog({
      force: true,
      fetchImpl: async () => new Response(JSON.stringify([SAMPLE_RELEASES[1]]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    })

    expect(releases).toEqual([SAMPLE_RELEASES[1]])
  })
})

describe("resolveSettingsSectionId", () => {
  test("accepts known settings sections", () => {
    expect(resolveSettingsSectionId("general")).toBe("general")
    expect(resolveSettingsSectionId("providers")).toBe("providers")
    expect(resolveSettingsSectionId("changelog")).toBe("changelog")
    expect(resolveSettingsSectionId("keybindings")).toBe("keybindings")
    expect(resolveSettingsSectionId("skills")).toBe("skills")
  })

  test("rejects unknown settings sections", () => {
    expect(resolveSettingsSectionId("page-1")).toBeNull()
    expect(resolveSettingsSectionId("page-2")).toBeNull()
    expect(resolveSettingsSectionId("page-3")).toBeNull()
    expect(resolveSettingsSectionId("nope")).toBeNull()
    expect(resolveSettingsSectionId(undefined)).toBeNull()
  })
})

describe("SkillsSection", () => {
  test("renders the skills.sh search box and installed section", () => {
    const html = renderToStaticMarkup(
      <SkillsSection
        state={{
          connectionStatus: "connected",
          socket: {
            command: async () => ({ skills: [] }),
          } as never,
        }}
      />
    )

    expect(html).toContain("Installed")
    expect(html).toContain("Add skills from skills.sh")
    expect(html).toContain("searchbox")
  })
})

describe("getKeybindingsSubtitle", () => {
  test("renders the active keybindings path", () => {
    expect(getKeybindingsSubtitle("~/.kanna-dev/keybindings.json")).toBe(
      "Edit global app shortcuts stored in ~/.kanna-dev/keybindings.json."
    )
  })
})

describe("shouldPreviewChatSoundChange", () => {
  test("previews only when the selected value actually changes", () => {
    expect(shouldPreviewChatSoundChange("always", "always")).toBe(false)
    expect(shouldPreviewChatSoundChange("always", "never")).toBe(true)
    expect(shouldPreviewChatSoundChange("never", "unfocused")).toBe(true)
    expect(shouldPreviewChatSoundChange("funk", "glass")).toBe(true)
  })
})

describe("ChangelogSection", () => {
  test("renders version highlights, release cards, markdown, links, and prerelease badges", () => {
    const html = renderToStaticMarkup(
      <ChangelogSection
        status="success"
        releases={SAMPLE_RELEASES}
        error={null}
        onRetry={() => {}}
        currentVersion="1.0.0"
      />
    )

    expect(html).not.toContain("You are currently running this version of Kanna.")
    expect(html).not.toContain(">Update<")
    expect(html).toContain("v0.8.1")
    expect(html).toContain("Better cursor color")
    expect(html).toContain('aria-label="View release on GitHub"')
    expect(html).toContain("https://github.com/jakemor/kanna/releases/tag/v0.8.1")
    expect(html).toContain("Prerelease")
    expect(html).toContain("No release notes were provided.")
    expect(html).toContain(formatPublishedDate("2026-03-19T16:53:08Z"))
    expect(html).not.toContain("View on GitHub")
  })

  test("renders an error state with retry action", () => {
    const html = renderToStaticMarkup(
      <ChangelogSection
        status="error"
        releases={[]}
        error="GitHub said no"
        onRetry={() => {}}
        currentVersion="1.0.0"
      />
    )

    expect(html).toContain("Could not load changelog")
    expect(html).toContain("GitHub said no")
    expect(html).toContain("Retry")
  })

})
