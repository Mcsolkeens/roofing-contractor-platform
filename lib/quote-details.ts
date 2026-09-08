/**
 * Per-service quote questions for the homeowner wizard.
 *
 * After the homeowner picks WHAT to quote (lib/quote-scope), each selected
 * service gets its own detail step whose questions live here. Keeping the
 * question config data-driven keeps the wizard component thin and lets the
 * review page + admin summary be generated from the same source of truth.
 *
 * Exterior-trim colours (siding / soffit / fascia / eavestrough) render as real
 * colour swatches, not text buttons, using the preferred RoofMart colour
 * families: White, Tan, Brown, Black (plus a Tint / Other escape hatch).
 * Roof vents are offered in Brown and Black per the RoofMart ventilation
 * catalogue (prozone.roofmart.ca).
 */

import { quoteScopeOptions, type QuoteScopeId } from "@/lib/quote-scope"

export type Answers = Record<string, string | string[]>

export interface ColorSwatch {
  id: string
  label: string
  /** Empty for "Tint / Other" — rendered without a colour chip. */
  hex: string
}

/** Preferred exterior colour families. */
export const COLOR_FAMILIES: ColorSwatch[] = [
  { id: "white", label: "White", hex: "#f1efe9" },
  { id: "tan", label: "Tan", hex: "#c8b394" },
  { id: "brown", label: "Brown", hex: "#5b4636" },
  { id: "black", label: "Black", hex: "#26262a" },
  { id: "other", label: "Tint / Other", hex: "" },
]

/** Roof vents come in two finishes. */
export const VENT_COLORS: ColorSwatch[] = [
  { id: "brown", label: "Brown", hex: "#5b4636" },
  { id: "black", label: "Black", hex: "#26262a" },
]

export interface Question {
  id: string
  label: string
  help?: string
  kind: "radio" | "checkbox" | "swatch"
  options?: { id: string; label: string }[]
  swatches?: ColorSwatch[]
  /** Required questions gate the Continue button. */
  required?: boolean
  /** Only shown when the predicate passes for the current answers. */
  showIf?: (a: Answers) => boolean
}

export interface ServiceSection {
  scope: QuoteScopeId
  /** Short name used in the review page + summary, e.g. "Roof". */
  label: string
  /** Step heading, e.g. "Tell us about your roof". */
  title: string
  questions: Question[]
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/** Build radio/checkbox options from plain labels. */
function opts(...labels: string[]) {
  return labels.map((label) => ({ id: slug(label), label }))
}

function answerArray(a: Answers, id: string): string[] {
  const v = a[id]
  return Array.isArray(v) ? v : []
}

const SECTIONS: ServiceSection[] = [
  {
    scope: "roof",
    label: "Roof",
    title: "Tell us about your roof",
    questions: [
      {
        id: "roof.type",
        label: "What type of roofing are you looking for?",
        kind: "radio",
        required: true,
        options: opts(
          "Asphalt shingles",
          "Metal roofing",
          "Cedar / shake",
          "Tile",
          "Slate",
          "Other",
          "Not sure",
        ),
      },
      {
        id: "roof.underlayment",
        label: "What type of underlayment would you like?",
        kind: "checkbox",
        options: opts("Synthetic underlayment", "Ice & water protection", "Both", "Not sure"),
      },
      {
        id: "roof.synthetic",
        label: "Choose a synthetic underlayment product",
        kind: "radio",
        options: opts("StormTite", "Other", "Not sure"),
        showIf: (a) => {
          const u = answerArray(a, "roof.underlayment")
          return u.includes("synthetic-underlayment") || u.includes("both")
        },
      },
      {
        id: "roof.accessories",
        label: "Roof accessories",
        kind: "checkbox",
        options: opts(
          "Ridge vent",
          "Roof vents",
          "Drip edge",
          "Flashing",
          "Ice & water protection",
          "Ridge caps",
          "Not sure",
        ),
      },
      {
        id: "roof.ventColor",
        label: "Roof vent colour",
        kind: "swatch",
        swatches: VENT_COLORS,
        showIf: (a) => answerArray(a, "roof.accessories").includes("roof-vents"),
      },
    ],
  },
  {
    scope: "siding",
    label: "Siding",
    title: "Tell us about your siding",
    questions: [
      {
        id: "siding.type",
        label: "What type of siding are you interested in?",
        kind: "radio",
        required: true,
        options: opts("Vinyl", "Fiber cement", "Metal", "Wood", "Composite", "Other", "Not sure"),
      },
      {
        id: "siding.color",
        label: "Choose a colour",
        kind: "swatch",
        swatches: COLOR_FAMILIES,
      },
      {
        id: "siding.style",
        label: "Siding style",
        kind: "radio",
        options: opts("Traditional", "Modern", "Board & batten", "Other", "Not sure"),
      },
    ],
  },
  {
    scope: "soffit",
    label: "Soffit",
    title: "Tell us about your soffit",
    questions: [
      {
        id: "soffit.material",
        label: "What material would you like?",
        kind: "radio",
        required: true,
        options: opts("Aluminum", "Vinyl / PVC", "Wood", "Fiber cement", "Composite", "Not sure"),
      },
      {
        id: "soffit.type",
        label: "What type of soffit?",
        kind: "radio",
        options: opts("Vented", "Solid / Non-vented", "Not sure"),
      },
      {
        id: "soffit.color",
        label: "Choose a colour",
        kind: "swatch",
        swatches: COLOR_FAMILIES,
      },
    ],
  },
  {
    scope: "fascia",
    label: "Fascia",
    title: "Tell us about your fascia",
    questions: [
      {
        id: "fascia.material",
        label: "What material would you like?",
        kind: "radio",
        required: true,
        options: opts("Aluminum", "Vinyl / PVC", "Wood", "Composite", "Not sure"),
      },
      {
        id: "fascia.color",
        label: "Choose a colour",
        kind: "swatch",
        swatches: COLOR_FAMILIES,
      },
    ],
  },
  {
    scope: "eavestrough",
    label: "Eavestrough",
    title: "Tell us about your eavestrough",
    questions: [
      {
        id: "eave.material",
        label: "What material would you like?",
        kind: "radio",
        required: true,
        options: opts("Aluminum", "Steel", "Copper", "Vinyl", "Not sure"),
      },
      {
        id: "eave.size",
        label: "What size?",
        kind: "radio",
        options: opts("5 inch", "6 inch", "Not sure"),
      },
      {
        id: "eave.downspouts",
        label: "Downspouts",
        kind: "radio",
        options: opts("Standard", "Oversized", "Not sure"),
      },
      {
        id: "eave.color",
        label: "Choose a colour",
        kind: "swatch",
        swatches: COLOR_FAMILIES,
      },
    ],
  },
]

const SCOPE_ORDER = quoteScopeOptions.map((o) => o.id)

/** The detail sections for the chosen scopes, in canonical display order. */
export function sectionsForScopes(scopes: readonly QuoteScopeId[]): ServiceSection[] {
  return SECTIONS.filter((s) => scopes.includes(s.scope)).sort(
    (a, b) => SCOPE_ORDER.indexOf(a.scope) - SCOPE_ORDER.indexOf(b.scope),
  )
}

/** Questions visible for the current answers (respects showIf). */
export function visibleQuestions(section: ServiceSection, answers: Answers): Question[] {
  return section.questions.filter((q) => !q.showIf || q.showIf(answers))
}

/** A section is complete when every required, currently-visible question is answered. */
export function isSectionComplete(section: ServiceSection, answers: Answers): boolean {
  return visibleQuestions(section, answers).every((q) => {
    if (!q.required) return true
    const v = answers[q.id]
    return Array.isArray(v) ? v.length > 0 : Boolean(v)
  })
}

/** Human label for a single answer, or null when unanswered. */
function answerToText(q: Question, answers: Answers): string | null {
  const v = answers[q.id]
  if (q.kind === "checkbox") {
    const arr = Array.isArray(v) ? v : []
    if (!arr.length) return null
    return arr.map((id) => q.options?.find((o) => o.id === id)?.label ?? id).join(", ")
  }
  if (typeof v !== "string" || !v) return null
  if (q.kind === "swatch") return q.swatches?.find((s) => s.id === v)?.label ?? v
  return q.options?.find((o) => o.id === v)?.label ?? v
}

export interface ReviewItem {
  question: string
  value: string
  /** Present for colour answers so the review can show a chip. */
  hex?: string
}

export interface ReviewGroup {
  scope: QuoteScopeId
  label: string
  items: ReviewItem[]
}

/** Structured summary for the review page UI. */
export function reviewGroups(scopes: readonly QuoteScopeId[], answers: Answers): ReviewGroup[] {
  return sectionsForScopes(scopes).map((section) => ({
    scope: section.scope,
    label: section.label,
    items: visibleQuestions(section, answers).flatMap((q) => {
      const value = answerToText(q, answers)
      if (!value) return []
      const hex =
        q.kind === "swatch" ? q.swatches?.find((s) => s.id === answers[q.id])?.hex : undefined
      return [{ question: q.label, value, ...(hex ? { hex } : {}) }]
    }),
  }))
}

/** Compact one-line-per-service string for the stored request + admin email. */
export function summarizeQuote(scopes: readonly QuoteScopeId[], answers: Answers): string {
  return sectionsForScopes(scopes)
    .map((section) => {
      const parts = visibleQuestions(section, answers)
        .map((q) => answerToText(q, answers))
        .filter((t): t is string => Boolean(t))
      return parts.length ? `${section.label}: ${parts.join("; ")}` : section.label
    })
    .join(" | ")
}
