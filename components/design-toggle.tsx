"use client"

import { useState } from "react"
import type { CSSProperties } from "react"

type Accent = "red" | "orange"

const RED = "oklch(0.58 0.215 27)"
const ORANGE = "oklch(0.66 0.2 44)"

const themes: Record<Accent, CSSProperties> = {
  red: {
    ["--accent" as string]: RED,
    ["--accent-foreground" as string]: "oklch(0.99 0 0)",
    ["--ring" as string]: RED,
    ["--chart-1" as string]: RED,
  },
  orange: {
    ["--accent" as string]: ORANGE,
    ["--accent-foreground" as string]: "oklch(0.99 0 0)",
    ["--ring" as string]: ORANGE,
    ["--chart-1" as string]: ORANGE,
  },
}

export function DesignShell({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState<Accent>("red")

  return (
    <div style={themes[accent]}>
      <div className="min-h-screen bg-background">{children}</div>

      {/* Floating design switcher */}
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-xl backdrop-blur">
          <span className="px-3 text-xs font-medium text-muted-foreground">Accent</span>
          <button
            type="button"
            onClick={() => setAccent("red")}
            aria-pressed={accent === "red"}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              accent === "red" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: RED }} />
            Red
          </button>
          <button
            type="button"
            onClick={() => setAccent("orange")}
            aria-pressed={accent === "orange"}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              accent === "orange" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: ORANGE }} />
            Orange
          </button>
        </div>
      </div>
    </div>
  )
}
