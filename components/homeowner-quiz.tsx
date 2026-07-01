"use client"

import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type ProductType = "shingles" | "flat" | "metal"

const productOptions: { id: ProductType; label: string; desc: string }[] = [
  { id: "shingles", label: "Shingles", desc: "Classic & versatile" },
  { id: "flat", label: "Flat roof", desc: "Modern, low-slope" },
  { id: "metal", label: "Metal roof", desc: "Durable & efficient" },
]

const colorOptions = [
  { id: "charcoal", label: "Charcoal", swatch: "oklch(0.28 0 0)" },
  { id: "slate-gray", label: "Slate gray", swatch: "oklch(0.55 0.02 250)" },
  { id: "weathered-wood", label: "Weathered wood", swatch: "oklch(0.5 0.04 70)" },
  { id: "barn-red", label: "Barn red", swatch: "oklch(0.45 0.15 25)" },
  { id: "forest-green", label: "Forest green", swatch: "oklch(0.42 0.08 150)" },
  { id: "sand", label: "Sandstone", swatch: "oklch(0.78 0.06 80)" },
]

const contractors = [
  {
    name: "Summit Roofing Co.",
    rating: 4.9,
    reviews: 312,
    distance: "2.4 km away",
    badge: "Top rated",
    specialties: ["Asphalt", "Metal"],
  },
  {
    name: "Maple Leaf Exteriors",
    rating: 4.8,
    reviews: 198,
    distance: "4.1 km away",
    badge: "Fast response",
    specialties: ["Asphalt", "Cedar"],
  },
  {
    name: "Northern Peak Roofers",
    rating: 5.0,
    reviews: 84,
    distance: "5.7 km away",
    badge: "New & rising",
    specialties: ["Slate", "Metal"],
  },
  {
    name: "TrueLine Roofing",
    rating: 4.7,
    reviews: 421,
    distance: "6.3 km away",
    badge: "Most booked",
    specialties: ["Asphalt", "Cedar", "Slate"],
  },
]

const TOTAL_STEPS = 3

export function HomeownerQuiz() {
  const [step, setStep] = useState(0)
  const [postal, setPostal] = useState("")
  const [product, setProduct] = useState<ProductType | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const postalValid = postal.trim().length >= 3

  async function submitRequest() {
    setSubmitting(true)
    try {
      await fetch("/api/measurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: postal, product, color }),
      })
    } catch (err) {
      console.log("[v0] measurement request failed:", (err as Error).message)
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }
  function reset() {
    setStep(0)
    setPostal("")
    setProduct(null)
    setColor(null)
    setSubmitted(false)
  }

  return (
    <section id="get-matched" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-sm font-medium uppercase tracking-widest text-muted-foreground">
              For homeowners
            </p>
            <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Tell us about your roof.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
              Answer three quick questions and we&apos;ll show you roofing companies near you. It&apos;s
              free, and you choose who to talk to.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "We check every company before they show up here",
                "Compare a few quotes before you decide",
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
                      {step < TOTAL_STEPS ? `Step ${step + 1} of ${TOTAL_STEPS}` : "Your matches"}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round((Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${(Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step 0 — postal code */}
                {step === 0 && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">Where&apos;s your home?</h3>
                    <p className="mt-2 text-muted-foreground">
                      We use this to find approved contractors near you.
                    </p>
                    <div className="mt-6">
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
                    <Button
                      onClick={next}
                      disabled={!postalValid}
                      className="mt-6 h-12 w-full bg-accent text-base text-accent-foreground hover:bg-accent/90"
                    >
                      Continue
                      <ArrowRight className="ml-1 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Step 1 — product type */}
                {step === 1 && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">Choose your product</h3>
                    <p className="mt-2 text-muted-foreground">
                      Pick the type of roof you&apos;re after.
                    </p>
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {productOptions.map((opt) => {
                        const active = product === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setProduct(opt.id)}
                            className={`rounded-xl border p-4 text-left transition-all ${
                              active
                                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                : "border-border hover:border-foreground/30"
                            }`}
                          >
                            <span className="block font-heading font-bold">{opt.label}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {opt.desc}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" onClick={back} className="h-12 px-4">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={next}
                        disabled={!product}
                        className="h-12 flex-1 bg-accent text-base text-accent-foreground hover:bg-accent/90"
                      >
                        Continue
                        <ArrowRight className="ml-1 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2 — color */}
                {step === 2 && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">Pick a color</h3>
                    <p className="mt-2 text-muted-foreground">
                      Choose the shade that suits your home.
                    </p>
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {colorOptions.map((opt) => {
                        const active = color === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setColor(opt.id)}
                            className={`rounded-xl border p-3 text-center transition-all ${
                              active
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border hover:border-foreground/30"
                            }`}
                          >
                            <span
                              className="mx-auto block h-12 w-full rounded-md border border-border"
                              style={{ backgroundColor: opt.swatch }}
                            />
                            <span className="mt-2 block text-xs font-medium">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" onClick={back} className="h-12 px-4">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={next}
                        disabled={!color}
                        className="h-12 flex-1 bg-accent text-base text-accent-foreground hover:bg-accent/90"
                      >
                        See my matches
                        <ArrowRight className="ml-1 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3 — contractor results */}
                {step === 3 && (
                  <div>
                    <h3 className="font-heading text-2xl font-bold">
                      {contractors.length} contractors near {postal || "you"}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Swipe through and select the ones you&apos;d like quotes from.
                    </p>

                    <div className="mt-6 -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-4">
                      {contractors.map((c) => (
                        <article
                          key={c.name}
                          className="w-64 shrink-0 snap-start rounded-xl border border-border bg-background p-5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                              {c.badge}
                            </span>
                            <ShieldCheck className="h-4 w-4 text-accent" />
                          </div>
                          <h4 className="mt-3 font-heading text-lg font-bold leading-tight">
                            {c.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-medium">{c.rating}</span>
                            <span className="text-muted-foreground">({c.reviews})</span>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {c.distance}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {c.specialties.map((s) => (
                              <span
                                key={s}
                                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="mt-2 flex gap-3">
                      <Button variant="outline" onClick={back} className="h-12 px-4">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={submitRequest}
                        disabled={submitting}
                        className="h-12 flex-1 bg-accent text-base text-accent-foreground hover:bg-accent/90"
                      >
                        {submitting ? "Sending…" : "Request free quotes"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <CheckCircle2 className="h-9 w-9 text-accent-foreground" />
                </span>
                <h3 className="mt-6 font-heading text-2xl font-bold">Thanks — we&apos;ve got it.</h3>
                <p className="mt-2 max-w-sm text-muted-foreground text-pretty">
                  We&apos;re pulling together your roof measurements and passing them to the roofers
                  you picked near{" "}
                  <span className="font-medium text-foreground">{postal}</span>. Expect to hear from
                  them in the next day or two.
                </p>
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
