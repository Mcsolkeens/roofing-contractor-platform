"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    q: "What does it cost me as a homeowner?",
    a: "Nothing. You answer a few questions, we show you roofing companies near you, and you get quotes for free. The roofing companies pay to be listed — you don't.",
  },
  {
    q: "How do you decide which companies get listed?",
    a: "Every company applies to be listed, and we check their business details, service area, and past work before they show up here. If they don't pass, they don't get listed.",
  },
  {
    q: "Which areas do you cover?",
    a: "We work with roofing companies across Canada. If there's no one in your immediate area, we'll point you to the closest companies we've checked out.",
  },
  {
    q: "Will you sell my details or spam me?",
    a: "No. We only pass your details to the companies you pick. We don't sell your phone number or email to anyone else.",
  },
  {
    q: "How soon will I hear back?",
    a: "Usually a day or two. Once you choose the companies you want to hear from, they reach out directly with a quote.",
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-muted-foreground">
            FAQ
          </p>
          <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Questions homeowners ask us.
          </h2>
        </div>

        <div className="mt-12 divide-y divide-border border-y border-border">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-lg font-bold">{faq.q}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-5 leading-relaxed text-muted-foreground text-pretty">{faq.a}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
