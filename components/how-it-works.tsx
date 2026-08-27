import { ClipboardList, Users, Hammer } from "lucide-react"

const steps = [
  {
    icon: ClipboardList,
    title: "Tell us about your roof",
    desc: "Your postal code, the type of roof you want, and the colour you're leaning toward. Takes about a minute, and you don't need an account.",
  },
  {
    icon: Users,
    title: "Pick roofers near you",
    desc: "We show you a short list of roofing companies close to you that we've already checked out. Tell us which ones you'd like quotes from.",
  },
  {
    icon: Hammer,
    title: "We take it from here",
    desc: "Our team pulls a precise roof measurement for your property and lines up your quotes. We'll reach out with everything, usually within a day or two.",
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
            Getting quotes takes about a minute.
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
