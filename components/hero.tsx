import { ArrowRight, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Free for homeowners · No obligation
          </span>

          <h1 className="mt-6 font-heading text-5xl font-bold leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Find a local <span className="text-primary">roofer</span> worth hiring.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Tell us a bit about your roof and we&apos;ll show you a few roofing companies near you
            that we&apos;ve already checked out. You decide who to talk to — no call centres, and we
            don&apos;t sell your number.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={<a href="#get-matched" />}
              size="lg"
              className="h-12 bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
            >
              See roofers near me
              <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
            <Button
              nativeButton={false}
              render={<a href="#contractors" />}
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base"
            >
              List your company
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-foreground" />
              We check every company first
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-foreground" />
              You only pay the roofer you hire
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-border shadow-2xl">
            <img
              src="/images/hero-roof.png"
              alt="Aerial view of a home with a newly installed asphalt shingle roof"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-card p-4 shadow-xl sm:block">
            <p className="font-heading text-3xl font-bold">1–2 days</p>
            <p className="text-sm text-muted-foreground">to hear back from roofers</p>
          </div>
          <div className="absolute -right-4 -top-4 hidden rotate-3 rounded-xl bg-accent px-4 py-3 shadow-xl sm:block">
            <p className="font-heading text-sm font-bold text-accent-foreground">No cost</p>
            <p className="text-xs text-accent-foreground/80">to homeowners</p>
          </div>
        </div>
      </div>
    </section>
  )
}
