"use client"

import { useState } from "react"
import { Menu, X, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Get a quote", href: "#get-matched" },
  { label: "Find a roofer", href: "#get-matched" },
  { label: "For contractors", href: "#contractors" },
  { label: "FAQ", href: "#faq" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground">
            <Home className="h-5 w-5 text-background" />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight">RoofPitch</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" nativeButton={false} render={<a href="/admin" />}>
            Admin
          </Button>
          <Button variant="ghost" nativeButton={false} render={<a href="#contractors" />}>
            Contractor login
          </Button>
          <Button
            nativeButton={false}
            render={<a href="#get-matched" />}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Find a roofer
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/admin"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Admin
            </a>
            <Button
              nativeButton={false}
              render={<a href="#get-matched" onClick={() => setOpen(false)} />}
              className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Find a roofer
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
