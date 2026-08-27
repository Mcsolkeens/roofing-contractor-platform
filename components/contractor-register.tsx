"use client"

import { useState, useRef } from "react"
import { CheckCircle2, TrendingUp, BadgeCheck, CalendarClock, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const perks = [
  {
    icon: TrendingUp,
    title: "Homeowners who are ready to hire",
    desc: "Every lead comes with the address, roof type, and measurements already sorted out — so you can quote without a site visit.",
  },
  {
    icon: BadgeCheck,
    title: "A profile homeowners trust",
    desc: "Once we've checked your company out, you get a verified badge on your listing that sets you apart.",
  },
  {
    icon: CalendarClock,
    title: "Only the jobs you want",
    desc: "Take the leads that fit your crew and your calendar. Skip the rest — there's no penalty for passing.",
  },
]

const serviceTypes = ["Asphalt", "Metal", "Cedar shake", "Slate", "Flat / commercial"]

export function ContractorRegister() {
  const [submitted, setSubmitted] = useState(false)
  const [services, setServices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for your logo.")
      return
    }
    // Keep it small so the whole application stays a lightweight payload.
    if (file.size > 1_000_000) {
      setError("Logo must be under 1 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogo(typeof reader.result === "string" ? reader.result : null)
    reader.readAsDataURL(file)
  }

  function clearLogo() {
    setLogo(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const form = new FormData(e.currentTarget)
    const area = String(form.get("area") ?? "")
    const postalCode = String(form.get("postalCode") ?? "")
    const yearRaw = String(form.get("yearEstablished") ?? "").trim()
    const res = await fetch("/api/contractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: form.get("business"),
        contactName: form.get("contact"),
        email: form.get("email"),
        phone: form.get("phone"),
        serviceArea: area,
        postalCode,
        specialties: services.map((s) => s.toLowerCase()),
        description: String(form.get("description") ?? "").trim() || undefined,
        yearEstablished: yearRaw ? Number(yearRaw) : undefined,
        logoUrl: logo ?? undefined,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(data.error ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <section id="contractors" className="border-b border-border bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-sm font-medium uppercase tracking-widest text-background/60">
              For contractors
            </p>
            <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Get roofing jobs from homeowners ready to hire.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-background/70 text-pretty">
              List your company and we&apos;ll send you leads from homeowners in your area — each one
              with the roof details already worked out. Apply once, and we&apos;ll review your
              business before you go live.
            </p>

            <div className="mt-10 space-y-6">
              {perks.map((perk) => (
                <div key={perk.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                    <perk.icon className="h-5 w-5 text-accent-foreground" />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold">{perk.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-background/60">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-background p-6 text-foreground shadow-2xl sm:p-8">
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <h3 className="font-heading text-2xl font-bold">Apply to join the network</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Applications are reviewed within 2 business days.
                </p>

                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Business name" id="business" placeholder="Summit Roofing Co." />
                    <Field label="Contact name" id="contact" placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email" id="email" type="email" placeholder="you@company.com" />
                    <Field label="Phone" id="phone" type="tel" placeholder="(555) 123-4567" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Service area (city/region)" id="area" placeholder="Greater Sudbury, ON" />
                    <Field
                      label="Primary postal code"
                      id="postalCode"
                      placeholder="P3A 1B2"
                    />
                  </div>
                  <p className="-mt-2 text-xs text-muted-foreground">
                    We use your postal code to match you with homeowners in your area.
                  </p>

                  <div>
                    <span className="mb-2 block text-sm font-medium">Services offered</span>
                    <div className="flex flex-wrap gap-2">
                      {serviceTypes.map((s) => {
                        const active = services.includes(s)
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleService(s)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              active
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-input hover:border-foreground/30"
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* About us / company description */}
                  <div>
                    <label htmlFor="description" className="mb-2 block text-sm font-medium">
                      About your company <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      maxLength={1000}
                      placeholder="Tell homeowners who you are, how long you've been roofing, and what makes your crew stand out."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Year established */}
                    <div>
                      <label htmlFor="yearEstablished" className="mb-2 block text-sm font-medium">
                        Year established <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <input
                        id="yearEstablished"
                        name="yearEstablished"
                        type="number"
                        min={1900}
                        max={new Date().getFullYear()}
                        placeholder="2008"
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                      />
                    </div>

                    {/* Logo upload */}
                    <div>
                      <span className="mb-2 block text-sm font-medium">
                        Company logo <span className="font-normal text-muted-foreground">(optional)</span>
                      </span>
                      {logo ? (
                        <div className="flex items-center gap-3 rounded-lg border border-input p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logo || "/placeholder.svg"}
                            alt="Company logo preview"
                            className="h-11 w-11 rounded-md border border-border object-contain"
                          />
                          <span className="flex-1 truncate text-sm text-muted-foreground">Logo added</span>
                          <button
                            type="button"
                            onClick={clearLogo}
                            aria-label="Remove logo"
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                        >
                          <Upload className="h-4 w-4" />
                          Upload logo
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, up to 1 MB.</p>
                    </div>
                  </div>
                </div>

                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-6 h-12 w-full bg-accent text-base text-accent-foreground hover:bg-accent/90"
                >
                  {loading ? "Submitting…" : "Submit application"}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  By applying you agree to RoofPitch&apos;s contractor terms.
                </p>
              </form>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <CheckCircle2 className="h-9 w-9 text-accent-foreground" />
                </span>
                <h3 className="mt-6 font-heading text-2xl font-bold">Application received</h3>
                <p className="mt-2 max-w-sm text-muted-foreground text-pretty">
                  Thanks for applying! Our team will review your details and reach out within 2
                  business days about getting your approved badge.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false)
                    setServices([])
                    clearLogo()
                  }}
                  className="mt-8 h-11"
                >
                  Submit another application
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  id,
  type = "text",
  placeholder,
}: {
  label: string
  id: string
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </div>
  )
}
