import { Home, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const columns = [
  {
    title: "Homeowners",
    links: ["How it works", "Get matched", "Browse contractors", "Reviews"],
  },
  {
    title: "Contractors",
    links: ["Join the network", "Contractor login", "Pricing", "Resources"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact", "Privacy"],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-foreground p-8 text-background sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Thinking about a new roof?
            </h2>
            <p className="mt-2 text-background/70">
              Answer a few questions and we&apos;ll show you roofers near you. It&apos;s free.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<a href="#get-matched" />}
            size="lg"
            className="h-12 shrink-0 bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
          >
            See roofers near me
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="#" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground">
                <Home className="h-5 w-5 text-background" />
              </span>
              <span className="font-heading text-xl font-bold tracking-tight">RoofPitch</span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              We help homeowners find roofing companies they can trust — and help good roofers find
              work.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} RoofPitch. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
