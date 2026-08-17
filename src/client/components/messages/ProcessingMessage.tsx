import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import { MetaRow, MetaContent } from "./shared"
import { AnimatedShinyText } from "../ui/animated-shiny-text"
import { formatElapsedDuration } from "./ResultMessage"

const STATUS_LABELS: Record<string, string> = {
  connecting: "Connecting...",
  acquiring_sandbox: "Booting...",
  initializing: "Initializing...",
  starting: "Starting...",
  running: "Running...",
  waiting_for_user: "Waiting...",
  failed: "Failed",
}

interface ProcessingMessageProps {
  status?: string
  startedAt?: number | null
}

export function ProcessingMessage({ status, startedAt = null }: ProcessingMessageProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt == null) return

    setNow(Date.now())
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [startedAt])

  const label = (status ? STATUS_LABELS[status] : undefined) || "Processing..."
  const isFailed = status === "failed"
  const elapsed = startedAt == null ? null : formatElapsedDuration(Math.max(0, now - startedAt))

  return (
    <MetaRow className="ml-[1px] mt-3">
      <MetaContent>
        {isFailed ? (
          <X className="size-4.5 text-red-500" />
        ) : (
          <Loader2 className="size-4.5 animate-spin text-muted-icon" />
        )}
        <AnimatedShinyText className="ml-[1px] text-sm" shimmerWidth={44}>
          {label}{elapsed ? ` · Running for ${elapsed}` : ""}
        </AnimatedShinyText>
      </MetaContent>
    </MetaRow>
  )
}
