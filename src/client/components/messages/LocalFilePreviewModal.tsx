import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { getProjectRelativePath } from "../../lib/pathUtils"
import type { OpenLocalLinkTarget } from "./shared"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogGhostButton,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { fetchTextPreview, TEXT_PREVIEW_LIMIT_BYTES } from "./attachmentPreview"

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: string; truncated: boolean }

interface Props {
  projectId: string | null
  projectPath: string | null | undefined
  target: OpenLocalLinkTarget | null
  onOpenChange: (open: boolean) => void
}

export function LocalFilePreviewModal({ projectId, projectPath, target, onOpenChange }: Props) {
  const relativePath = useMemo(
    () => target ? getProjectRelativePath(target.path, projectPath) : null,
    [projectPath, target],
  )
  const contentUrl = projectId && relativePath
    ? `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(relativePath)}/content`
    : target
      ? `/api/local-files/content?path=${encodeURIComponent(target.path)}`
      : null
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "idle" })
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle")

  useEffect(() => {
    setCopyState("idle")
  }, [target])

  useEffect(() => {
    if (!target || !contentUrl) {
      setPreviewState({ status: "idle" })
      return
    }

    let cancelled = false
    setPreviewState({ status: "loading" })

    void fetchTextPreview(contentUrl, TEXT_PREVIEW_LIMIT_BYTES)
      .then((result) => {
        if (!cancelled) {
          setPreviewState({ status: "ready", ...result })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPreviewState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to load file preview.",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [contentUrl, target])

  async function handleCopyContents() {
    if (previewState.status !== "ready" || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return
    }
    try {
      await navigator.clipboard.writeText(previewState.content)
      setCopyState("copied")
    } catch {
      setCopyState("error")
    }
  }

  function handleOpenInNewTab() {
    if (!contentUrl || typeof window === "undefined") return
    window.open(new URL(contentUrl, document.baseURI || window.location.href).toString(), "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-w-[min(92vw,960px)] overflow-hidden p-0">
        <DialogHeader className="pr-12">
          <DialogTitle className="truncate text-md">{relativePath ?? target?.path ?? "File preview"}</DialogTitle>
          <DialogDescription>
            Read-only preview{target?.line ? ` · line ${target.line}` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="bg-muted/20 p-4">
          {previewState.status === "loading" ? (
            <div className="flex h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading preview…</div>
          ) : previewState.status === "error" ? (
            <div className="flex h-[50vh] items-center justify-center text-sm text-destructive">{previewState.message}</div>
          ) : previewState.status === "ready" ? (
            <div className="space-y-3">
              {previewState.truncated ? (
                <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  Preview truncated to 1024 KB.
                </div>
              ) : null}
              <ReadOnlyFileContent content={previewState.content} focusLine={target?.line} />
            </div>
          ) : (
            <div className="flex h-[50vh] items-center justify-center text-sm text-muted-foreground">
              This file is not inside the active project.
            </div>
          )}
        </DialogBody>
        <DialogFooter className="items-center justify-between gap-3 px-4 py-3">
          <DialogDescription className="truncate">
            {target?.path ?? ""}
          </DialogDescription>
          <div className="flex items-center gap-2">
            <DialogGhostButton
              type="button"
              onClick={() => void handleCopyContents()}
              disabled={previewState.status !== "ready"}
              aria-live="polite"
            >
              {copyState === "copied" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copyState === "copied" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy Contents"}
            </DialogGhostButton>
            <Button type="button" variant="outline" onClick={handleOpenInNewTab} disabled={!contentUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open In New Tab
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReadOnlyFileContent({ content, focusLine }: { content: string; focusLine?: number }) {
  const lines = useMemo(() => content.split("\n"), [content])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<Array<HTMLTableRowElement | null>>([])
  const focusedLine = focusLine && lines.length > 0
    ? Math.min(Math.max(focusLine, 1), lines.length)
    : null

  useEffect(() => {
    if (!focusedLine || !scrollRef.current) return

    const frame = window.requestAnimationFrame(() => {
      const row = lineRefs.current[focusedLine - 1]
      const container = scrollRef.current
      if (!row || !container) return
      container.scrollTop = Math.max(0, row.offsetTop - container.clientHeight / 2 + row.offsetHeight / 2)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [content, focusedLine])

  return (
    <div ref={scrollRef} className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background">
      <table className="w-full border-collapse text-xs leading-relaxed font-mono">
        <tbody>
          {lines.map((line, index) => {
            const lineNumber = index + 1
            const isFocused = lineNumber === focusedLine
            return (
              <tr
                key={lineNumber}
                ref={(row) => {
                  lineRefs.current[index] = row
                }}
                className={isFocused ? "bg-accent" : undefined}
              >
                <td className="sticky left-0 select-none whitespace-nowrap border-r border-border bg-muted/80 px-3 py-0.5 text-right text-muted-foreground">
                  {lineNumber}
                </td>
                <td className="whitespace-pre px-3 py-0.5 text-left text-foreground">
                  {line || "\u00A0"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
