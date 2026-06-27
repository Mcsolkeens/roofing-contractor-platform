"use client"

import { useState } from "react"
import { CheckCircle2, TrendingUp, BadgeCheck, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"

const perks = [
  {
    icon: TrendingUp,
    title: "Qualified leads, not tire-kickers",
    desc: "Homeowners come to you ready to hire, with project details already filled in.",
  },
  {
    icon: BadgeCheck,
    title: "An approved badge that builds trust",
    desc: "Stand out with a verified profile that homeowners know they can rely on.",
  },
  {
    icon: CalendarClock,
    title: "You control your schedule",
    desc: "Accept the jobs that fit your crew and your calendar. No obligations.",
  },
]

const serviceTypes = ["Asphalt", "Metal", "Cedar shake", "Slate", "Flat / commercial"]

export function ContractorRegister() {
  const [submitted, setSubmitted] = useState(false)
  const [services, setServices] = useState<string[]>([])

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
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
              Grow your roofing business with RoofPitch.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-background/70 text-pretty">
              Join a network of approved contractors and get matched with homeowners who are ready
              to start their project. Apply once — our team reviews every application.
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
                  <Field
                    label="Service area (postal / city)"
                    id="area"
                    placeholder="Toronto, ON"
                  />

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
                </div>

                <Button
                  type="submit"
                  className="mt-6 h-12 w-full bg-accent text-base text-accent-foreground hover:bg-accent/90"
                >
                  Submit application
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
