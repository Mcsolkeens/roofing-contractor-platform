"use client"

import type { QuoteScopeId } from "@/lib/quote-scope"

/**
 * Functional legend colours for each quote scope. These are load-bearing (they
 * key the diagram regions to the checklist), not decorative, so they live
 * outside the theme palette. Kept in sync with the dots on the scope options.
 */
export const scopeColors: Record<QuoteScopeId, { fill: string; ring: string }> = {
  roof: { fill: "#2563eb", ring: "#1d4ed8" },
  siding: { fill: "#64748b", ring: "#475569" },
  soffit: { fill: "#f59e0b", ring: "#b45309" },
  fascia: { fill: "#10b981", ring: "#047857" },
  eavestrough: { fill: "#8b5cf6", ring: "#6d28d9" },
}

const IDLE_FILL = "#e2e8f0"
const IDLE_STROKE = "#cbd5e1"

type LabelSpec = {
  id: QuoteScopeId
  text: string
  cx: number
  cy: number
  w: number
  leader?: [number, number, number, number] // x1,y1 (pill) -> x2,y2 (region)
}

const LABELS: LabelSpec[] = [
  { id: "roof", text: "Roof", cx: 340, cy: 86, w: 58, leader: [325, 96, 258, 150] },
  { id: "soffit", text: "Soffit", cx: 40, cy: 214, w: 62, leader: [71, 214, 96, 219] },
  { id: "fascia", text: "Fascia", cx: 420, cy: 198, w: 64, leader: [388, 201, 372, 208] },
  { id: "eavestrough", text: "Eavestrough", cx: 402, cy: 286, w: 98, leader: [382, 282, 374, 276] },
  { id: "siding", text: "Siding", cx: 128, cy: 300, w: 62 },
]

export function HouseDiagram({
  selected,
  active,
  onToggle,
  className,
}: {
  selected: QuoteScopeId[]
  active?: QuoteScopeId
  onToggle?: (id: QuoteScopeId) => void
  className?: string
}) {
  const isOn = (id: QuoteScopeId) => selected.includes(id)

  function regionProps(id: QuoteScopeId) {
    const on = isOn(id)
    const c = scopeColors[id]
    return {
      fill: on ? c.fill : IDLE_FILL,
      stroke: on ? c.ring : IDLE_STROKE,
      strokeWidth: active === id ? 3 : 1.5,
      className: [
        onToggle ? "cursor-pointer" : "",
        active === id ? "animate-pulse" : "",
        "transition-colors duration-300",
      ]
        .filter(Boolean)
        .join(" "),
      onClick: onToggle ? () => onToggle(id) : undefined,
      role: onToggle ? "button" : undefined,
      "aria-label": onToggle ? `${id} — ${on ? "selected" : "not selected"}` : undefined,
      tabIndex: onToggle ? 0 : undefined,
      onKeyDown: onToggle
        ? (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onToggle(id)
            }
          }
        : undefined,
    }
  }

  return (
    <svg
      viewBox="0 0 460 360"
      className={className}
      role="img"
      aria-label="House diagram highlighting the parts you selected to quote"
    >
      {/* ground baseline */}
      <line x1="18" y1="324" x2="442" y2="324" stroke={IDLE_STROKE} strokeWidth="2" strokeLinecap="round" />

      {/* SIDING — walls (drawn first, sits behind eave trims) */}
      <rect {...regionProps("siding")} x="82" y="230" width="276" height="94" rx="3" />

      {/* neutral house detail: door + windows (not selectable) */}
      <g fill="#f8fafc" stroke={IDLE_STROKE} strokeWidth="1.5">
        <rect x="204" y="262" width="42" height="62" rx="2" />
        <rect x="108" y="250" width="44" height="36" rx="2" />
        <rect x="290" y="250" width="44" height="36" rx="2" />
      </g>
      <line x1="225" y1="262" x2="225" y2="324" stroke={IDLE_STROKE} strokeWidth="1" />

      {/* EAVESTROUGH — gutter along the eave + downspout */}
      <rect {...regionProps("eavestrough")} x="48" y="220" width="344" height="12" rx="6" />
      <rect {...regionProps("eavestrough")} x="366" y="232" width="11" height="92" rx="3" />

      {/* SOFFIT — underside band of the overhang */}
      <rect {...regionProps("soffit")} x="70" y="211" width="300" height="10" rx="2" />

      {/* FASCIA — trim board on the roof edge */}
      <rect {...regionProps("fascia")} x="48" y="202" width="344" height="10" rx="2" />

      {/* ROOF — gable with overhang */}
      <polygon {...regionProps("roof")} points="52,205 230,58 388,205" />

      {/* labels */}
      {LABELS.map((l) => {
        const on = isOn(l.id)
        const c = scopeColors[l.id]
        return (
          <g key={l.id}>
            {l.leader && (
              <line
                x1={l.leader[0]}
                y1={l.leader[1]}
                x2={l.leader[2]}
                y2={l.leader[3]}
                stroke={on ? c.ring : IDLE_STROKE}
                strokeWidth="1.5"
              />
            )}
            <rect
              x={l.cx - l.w / 2}
              y={l.cy - 11}
              width={l.w}
              height="22"
              rx="11"
              fill={on ? c.fill : "#f1f5f9"}
              stroke={on ? c.ring : "#e2e8f0"}
              strokeWidth="1"
              className="transition-colors duration-300"
            />
            <text
              x={l.cx}
              y={l.cy + 4}
              textAnchor="middle"
              className="font-sans"
              fontSize="12"
              fontWeight="600"
              fill={on ? "#ffffff" : "#64748b"}
            >
              {l.text}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
