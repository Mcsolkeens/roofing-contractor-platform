"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { manufacturers, findManufacturer, findLine } from "@/lib/shingle-brands"
import { quoteScopeOptions, formatScopes, type QuoteScopeId } from "@/lib/quote-scope"
import {
  sectionsForScopes,
  visibleQuestions,
  isSectionComplete,
  reviewGroups,
  summarizeQuote,
  type Answers,
  type Question,
  type ColorSwatch,
} from "@/lib/quote-details"

interface PublicContractor {
  id: string
  company: string
  serviceArea: string
  specialties: string[]
}

type StepKind = "scope" | "service" | "review" | "address" | "brand" | "line" | "color" | "matches"
interface WizardStep {
  kind: StepKind
  scope?: QuoteScopeId
}

/** Empty-hex ("Tint / Other") swatch fill so it still reads as a colour chip. */
const OTHER_SWATCH = "conic-gradient(from 210deg, #d7d3ca, #a8a29a, #d7d3ca)"

function RadioField({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {question.options?.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
              active
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "border-border hover:border-foreground/30"
            }`}
          >
            <span>{o.label}</span>
            {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}

function CheckboxField({
  question,
  value,
  onToggle,
}: {
  question: Question
  value: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {question.options?.map((o) => {
        const checked = value.includes(o.id)
        return (
          <label
            key={o.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all ${
              checked
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "border-border hover:border-foreground/30"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(o.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {checked && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0">{o.label}</span>
          </label>
        )
      })}
    </div>
  )
}

function SwatchField({
  swatches,
  value,
  onChange,
}: {
  swatches: ColorSwatch[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {swatches.map((sw) => {
        const active = value === sw.id
        return (
          <button
            key={sw.id}
            type="button"
            onClick={() => onChange(sw.id)}
            aria-pressed={active}
            aria-label={sw.label}
            className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-sm transition-all ${
              active
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-foreground/30"
            }`}
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 shrink-0 rounded-full border border-border/70"
              style={{ background: sw.hex || OTHER_SWATCH }}
            />
            <span className="min-w-0 truncate">{sw.label}</span>
            {active && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}

export function HomeownerQuiz() {
  const [stepIndex, setStepIndex] = useState(0)
  const [scopes, setScopes] = useState<QuoteScopeId[]>([])
  const [answers, setAnswers] = useState<Answers>({})
  const [postal, setPostal] = useState("")
  const [address, setAddress] = useState("")
  const [manufacturerId, setManufacturerId] = useState<string | null>(null)
  const [lineId, setLineId] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [contractors, setContractors] = useState<PublicContractor[]>([])
  const [loadingContractors, setLoadingContractors] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const postalValid = postal.trim().length >= 3
  const activeManufacturer = findManufacturer(manufacturerId)
  const activeLine = findLine(manufacturerId, lineId)
  const roofSelected = scopes.includes("roof")

  const sections = useMemo(() => sectionsForScopes(scopes), [scopes])

  // The wizard's steps are dynamic: one detail step per selected service, a
  // review, the address, then the shingle picker (only when Roof is in scope),
  // and finally the contractor matches.
  const steps = useMemo<WizardStep[]>(() => {
    const list: WizardStep[] = [{ kind: "scope" }]
    sections.forEach((s) => list.push({ kind: "service", scope: s.scope }))
    list.push({ kind: "review" }, { kind: "address" })
    if (roofSelected) list.push({ kind: "brand" }, { kind: "line" }, { kind: "color" })
    list.push({ kind: "matches" })
    return list
  }, [sections, roofSelected])

  const current = steps[Math.min(stepIndex, steps.length - 1)]
  const questionSteps = steps.length - 1 // everything except the matches results
  const nextIsMatches = steps[stepIndex + 1]?.kind === "matches"
  const progress = stepIndex / (steps.length - 1)

  function toggleScope(id: QuoteScopeId) {
    setScopes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  function setRadio(qid: string, val: string) {
    setAnswers((a) => ({ ...a, [qid]: val }))
  }
  function toggleCheckbox(qid: string, val: string) {
    setAnswers((a) => {
      const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : []
      return { ...a, [qid]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] }
    })
  }
  function toggleSelected(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function goToMatches() {
    setLoadingContractors(true)
    try {
      const res = await fetch(`/api/contractors?postalCode=${encodeURIComponent(postal)}&limit=6`)
      const data = (await res.json()) as { contractors: PublicContractor[] }
      setContractors(data.contractors ?? [])
      setSelectedIds((data.contractors ?? []).map((c) => c.id))
    } catch (err) {
      console.log("[v0] failed to load contractors:", (err as Error).message)
      setContractors([])
    } finally {
      setLoadingContractors(false)
      setStepIndex(steps.length - 1)
    }
  }

  function resolveColorLabel(): string {
    if (!activeManufacturer || !activeLine) return ""
    const picked = activeLine.colors.find((c) => c.id === color)
    const base = `${activeManufacturer.name} ${activeLine.name}`
    return picked ? `${base} — ${picked.label}` : base
  }

  async function submitRequest() {
    setSubmitting(true)
    try {
      const detailsSummary = summarizeQuote(scopes, answers)
      const shingle = activeLine ? `${activeManufacturer?.name} ${activeLine.name}` : ""
      const product =
        [detailsSummary, shingle ? `Shingle: ${shingle}` : ""].filter(Boolean).join(" | ") ||
        formatScopes(scopes)

      await fetch("/api/measurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: postal,
          address: address || postal,
          scopes,
          product,
          color: resolveColorLabel(),
          homeownerEmail: email || undefined,
          contractorIds: selectedIds,
        }),
      })
    } catch (err) {
      console.log("[v0] measurement request failed:", (err as Error).message)
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  function primaryAction() {
    if (nextIsMatches) void goToMatches()
    else setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }
  function reset() {
    setStepIndex(0)
    setScopes([])
    setAnswers({})
    setPostal("")
    setAddress("")
    setManufacturerId(null)
    setLineId(null)
    setColor(null)
    setEmail("")
    setSubmitted(false)
    setContractors([])
    setSelectedIds([])
  }

  function canAdvance(): boolean {
    switch (current.kind) {
      case "scope":
        return scopes.length > 0
      case "service": {
        const sec = sections.find((s) => s.scope === current.scope)
        return sec ? isSectionComplete(sec, answers) : true
      }
      case "address":
        return postalValid
      case "brand":
        return Boolean(manufacturerId)
      case "line":
        return Boolean(lineId)
      case "color":
        return Boolean(color)
      default:
        return true
    }
  }

  const activeSection =
    current.kind === "service" ? sections.find((s) => s.scope === current.scope) : undefined
  const groups = reviewGroups(scopes, answers)

  return (
    <section id="get-matched" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-sm font-medium uppercase tracking-widest text-muted-foreground">
              For homeowners
            </p>
            <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Get a quote for your home.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
              Tell us what you want quoted, answer a few quick questions, review your request, then
              choose the roofing companies near you that you&apos;d like to hear from. It&apos;s
              free, and our team handles the rest.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "We check every company before they show up here",
                "We measure your roof and line up your quotes",
                "We don't sell your phone number or email",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <Check className="h-3 w-3 text-accent-foreground" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
            {!submitted ? (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {current.kind === "matches"
                        ? "Your matches"
                        : `Step ${stepIndex + 1} of ${questionSteps}`}
                    </span>
                    <span className="text-muted-foreground">{Math.round(progress * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>

                {/* Scope — what to quote for (drives the report we order) */}
                {current.kind === "scope" && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">
                      What would you like to quote for?
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Pick everything that applies — you can choose more than one.
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                      {quoteScopeOptions.map((opt) => {
                        const checked = scopes.includes(opt.id)
                        return (
                          <label
                            key={opt.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                              checked
                                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                : "border-border hover:border-foreground/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleScope(opt.id)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border"
                              }`}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-heading font-bold">{opt.label}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {opt.desc}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Service detail — per-scope questions */}
                {current.kind === "service" && activeSection && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">{activeSection.title}</h3>
                    <div className="mt-6 space-y-6">
                      {visibleQuestions(activeSection, answers).map((q) => (
                        <div key={q.id}>
                          <p className="mb-2.5 text-sm font-medium">
                            {q.label}
                            {q.required && <span className="ml-1 text-accent">*</span>}
                          </p>
                          {q.kind === "radio" && (
                            <RadioField
                              question={q}
                              value={(answers[q.id] as string) ?? ""}
                              onChange={(v) => setRadio(q.id, v)}
                            />
                          )}
                          {q.kind === "checkbox" && (
                            <CheckboxField
                              question={q}
                              value={Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : []}
                              onToggle={(id) => toggleCheckbox(q.id, id)}
                            />
                          )}
                          {q.kind === "swatch" && q.swatches && (
                            <SwatchField
                              swatches={q.swatches}
                              value={(answers[q.id] as string) ?? ""}
                              onChange={(v) => setRadio(q.id, v)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review — everything the homeowner asked for */}
                {current.kind === "review" && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">Review your quote request</h3>
                    <p className="mt-2 text-muted-foreground">
                      Here&apos;s what we&apos;ll price. Go back to change anything.
                    </p>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Services requested
                        </p>
                        <p className="mt-1 font-heading font-bold">{formatScopes(scopes)}</p>
                      </div>
                      {groups.map((g) => (
                        <div key={g.scope} className="rounded-xl border border-border p-4">
                          <p className="font-heading font-bold">{g.label}</p>
                          {g.items.length > 0 ? (
                            <ul className="mt-2 space-y-1.5">
                              {g.items.map((it) => (
                                <li
                                  key={it.question}
                                  className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                  {it.hex !== undefined && (
                                    <span
                                      aria-hidden="true"
                                      className="h-4 w-4 shrink-0 rounded-full border border-border/70"
                                      style={{ background: it.hex || OTHER_SWATCH }}
                                    />
                                  )}
                                  <span className="font-medium text-foreground">{it.value}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-sm text-muted-foreground">No preferences set.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Address / location */}
                {current.kind === "address" && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">Where&apos;s your home?</h3>
                    <p className="mt-2 text-muted-foreground">
                      We use this to measure your roof and find approved contractors near you.
                    </p>
                    <div className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="address" className="mb-2 block text-sm font-medium">
                          Street address <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. 123 King St W, Toronto, ON"
                          className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label htmlFor="postal" className="mb-2 block text-sm font-medium">
                          Postal code
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <input
                            id="postal"
                            value={postal}
                            onChange={(e) => setPostal(e.target.value.toUpperCase())}
                            placeholder="e.g. M5V 2T6"
                            className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shingle manufacturer (roof only) */}
                {current.kind === "brand" && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">Pick a shingle brand</h3>
                    <p className="mt-2 text-muted-foreground">
                      Choose the manufacturer you&apos;d like quoted for your roof.
                    </p>
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {manufacturers.map((m) => {
                        const active = manufacturerId === m.id
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setManufacturerId(m.id)
                              setLineId(null)
                              setColor(null)
                            }}
                            className={`rounded-xl border p-4 text-left transition-all ${
                              active
                                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                : "border-border hover:border-foreground/30"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-heading text-lg font-bold">{m.name}</span>
                              {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                              {m.blurb}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Shingle product line (roof only) */}
                {current.kind === "line" && activeManufacturer && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">
                      Choose your {activeManufacturer.name} shingle
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Two {activeManufacturer.name} lines to choose from.
                    </p>
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {activeManufacturer.lines.map((l) => {
                        const active = lineId === l.id
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setLineId(l.id)
                              setColor(null)
                            }}
                            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
                              active
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border hover:border-foreground/30"
                            }`}
                          >
                            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-border">
                              {l.hero ? (
                                <Image
                                  src={l.hero || "/placeholder.svg"}
                                  alt={`${l.name} shingles`}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 300px"
                                  className="object-cover"
                                />
                              ) : (
                                <span aria-hidden="true" className="flex h-full w-full">
                                  {l.colors.slice(0, 6).map((c) => (
                                    <span
                                      key={c.id}
                                      className="h-full flex-1"
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                </span>
                              )}
                            </span>
                            <span className="mt-3 flex items-center justify-between gap-2">
                              <span className="font-heading text-sm font-bold leading-tight">
                                {l.name}
                              </span>
                              {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                            </span>
                            <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {l.tagline}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Shingle colour (roof only) */}
                {current.kind === "color" &&
                  activeLine &&
                  (() => {
                    const activeColor = activeLine.colors.find((c) => c.id === color) ?? null
                    const previewColor = activeColor ?? activeLine.colors[0] ?? null
                    return (
                      <div>
                        <h3 className="font-heading text-2xl font-bold">Pick a shingle colour</h3>
                        <p className="mt-2 text-muted-foreground">
                          {activeLine.colors.length} colours available on {activeLine.name}.
                        </p>
                        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                          <div className="sm:w-2/5">
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border">
                              {previewColor?.image ? (
                                <Image
                                  src={previewColor.image || "/placeholder.svg"}
                                  alt={`${activeLine.name} in ${previewColor.label}`}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 240px"
                                  className="object-cover"
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="block h-full w-full"
                                  style={{ backgroundColor: previewColor?.hex }}
                                />
                              )}
                            </div>
                            <p className="mt-2 text-center text-sm font-medium">
                              {previewColor?.label}
                            </p>
                          </div>
                          <div className="grid flex-1 grid-cols-4 gap-2 self-start">
                            {activeLine.colors.map((c) => {
                              const active = color === c.id
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setColor(c.id)}
                                  title={c.label}
                                  aria-label={c.label}
                                  aria-pressed={active}
                                  className={`relative aspect-square overflow-hidden rounded-md border transition-all ${
                                    active
                                      ? "border-primary ring-2 ring-primary/40"
                                      : "border-border hover:border-foreground/40"
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                >
                                  {c.image && (
                                    <Image
                                      src={c.image || "/placeholder.svg"}
                                      alt=""
                                      fill
                                      sizes="80px"
                                      className="object-cover"
                                    />
                                  )}
                                  {active && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                      <Check className="h-4 w-4 text-primary-foreground drop-shadow" />
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                {/* Contractor matches */}
                {current.kind === "matches" && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">
                      {contractors.length > 0
                        ? `${contractors.length} contractor${contractors.length === 1 ? "" : "s"} near ${postal || "you"}`
                        : `No approved roofers near ${postal || "you"} yet`}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {contractors.length > 0
                        ? "Select the companies you'd like quotes from."
                        : "We'll still measure your roof and reach out as soon as a roofer in your area is approved."}
                    </p>

                    {contractors.length > 0 && (
                      <div className="mt-6">
                        {contractors.length > 1 && (
                          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            Swipe to browse all {contractors.length}
                          </p>
                        )}
                        <div
                          className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3 sm:-mx-8 sm:px-8"
                          role="listbox"
                          aria-label="Roofing companies near you"
                        >
                          {contractors.map((c) => {
                            const selected = selectedIds.includes(c.id)
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleSelected(c.id)}
                                role="option"
                                aria-selected={selected}
                                className={`flex shrink-0 basis-[82%] snap-start flex-col justify-between rounded-xl border p-4 text-left transition-all sm:basis-[60%] ${
                                  selected
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                    : "border-border hover:border-foreground/30"
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                                      <h4 className="truncate font-heading text-base font-bold">
                                        {c.company}
                                      </h4>
                                    </div>
                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                        selected
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border"
                                      }`}
                                    >
                                      {selected && <Check className="h-3 w-3" />}
                                    </span>
                                  </div>
                                  {c.serviceArea && (
                                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {c.serviceArea}
                                    </p>
                                  )}
                                  {c.specialties.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {c.specialties.map((s) => (
                                        <span
                                          key={s}
                                          className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="mt-4 text-xs font-medium text-muted-foreground">
                                  {selected ? "Selected — tap to remove" : "Tap to select"}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <label htmlFor="quiz-email" className="mb-2 block text-sm font-medium">
                        Email{" "}
                        <span className="text-muted-foreground">(so we can send your quotes)</span>
                      </label>
                      <input
                        id="quiz-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}

                {/* Footer nav */}
                <div className="mt-6 flex gap-3">
                  {stepIndex > 0 && (
                    <Button variant="outline" onClick={back} className="h-12 px-4">
                      <ArrowLeft className="h-5 w-5" />
                      <span className="sr-only">Back</span>
                    </Button>
                  )}
                  {current.kind === "matches" ? (
                    <Button
                      onClick={submitRequest}
                      disabled={submitting || (contractors.length > 0 && selectedIds.length === 0)}
                      className="h-12 flex-1 bg-accent text-base text-accent-foreground hover:bg-accent/90"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-1 h-5 w-5 animate-spin" /> Sending…
                        </>
                      ) : (
                        "Request free quotes"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={primaryAction}
                      disabled={!canAdvance() || loadingContractors}
                      className="h-12 flex-1 bg-accent text-base text-accent-foreground hover:bg-accent/90"
                    >
                      {loadingContractors ? (
                        <>
                          <Loader2 className="mr-1 h-5 w-5 animate-spin" /> Finding roofers…
                        </>
                      ) : nextIsMatches ? (
                        <>
                          See my matches
                          <ArrowRight className="ml-1 h-5 w-5" />
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-1 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <CheckCircle2 className="h-9 w-9 text-accent-foreground" />
                </span>
                <h3 className="mt-6 font-heading text-2xl font-bold">Request received</h3>
                <p className="mt-2 max-w-sm text-muted-foreground text-pretty">
                  Thanks! We&apos;ve got your{" "}
                  <span className="font-medium text-foreground">{formatScopes(scopes)}</span> request
                  for the property near{" "}
                  <span className="font-medium text-foreground">{postal}</span>. Our team is
                  reviewing it and will be in touch with your free quotes soon.
                </p>
                {email && (
                  <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                    We&apos;ll reach out at{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                  </p>
                )}
                <Button variant="outline" onClick={reset} className="mt-8 h-11">
                  Start a new request
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
