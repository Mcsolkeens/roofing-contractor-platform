"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    q: "How much does RoofPitch cost homeowners?",
    a: "It's completely free for homeowners. You answer a few questions, get matched with approved contractors, and receive quotes at no cost or obligation.",
  },
  {
    q: "How are contractors approved?",
    a: "Every contractor applies to join and is reviewed by our team. We verify their business details, service area, and track record before they can appear in matches.",
  },
  {
    q: "What areas do you cover?",
    a: "RoofPitch matches homeowners with contractors across Canada. If we don't have a contractor in your immediate area, we'll connect you with the closest approved pros.",
  },
  {
    q: "Will my information be sold or spammed?",
    a: "Never. Your details are only shared with the contractors you choose to request quotes from. We don't sell your data to third parties.",
  },
  {
    q: "How quickly will I hear back?",
    a: "Most homeowners receive their first free quotes within 24 hours of getting matched.",
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
            Questions, answered.
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
