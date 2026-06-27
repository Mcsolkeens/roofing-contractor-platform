import { ClipboardList, Users, Hammer } from "lucide-react"

const steps = [
  {
    icon: ClipboardList,
    title: "Tell us about your roof",
    desc: "Answer a few quick questions about your location, shingle type, and color preferences. Takes about a minute.",
  },
  {
    icon: Users,
    title: "Get matched instantly",
    desc: "We surface approved, top-rated contractors near you. Swipe through profiles and pick the ones you like.",
  },
  {
    icon: Hammer,
    title: "Get the job done right",
    desc: "Receive free quotes, compare them, and hire with confidence. Every contractor on RoofPitch is vetted.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Three steps to a better roof.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary"
            >
              <span className="font-heading text-6xl font-bold text-accent">0{i + 1}</span>
              <span className="mt-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <step.icon className="h-6 w-6 text-primary-foreground" />
              </span>
              <h3 className="mt-5 font-heading text-xl font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
