"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BadgeCheck, Building2, MapPin, Search, ShieldCheck } from "lucide-react"
import type { PublicContractor } from "@/lib/public-contractors"

const fetcher = async (url: string): Promise<{ contractors: PublicContractor[] }> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Unable to load contractors")
  return response.json()
}

export function ContractorDirectory() {
  const [search, setSearch] = useState("")
  const { data, error, isLoading } = useSWR<{ contractors: PublicContractor[] }>(
    "/api/contractors?limit=100",
    fetcher,
  )
  const contractors = data?.contractors ?? []
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return contractors
    return contractors.filter((contractor) =>
      [contractor.company, contractor.serviceArea, ...contractor.specialties]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
    )
  }, [contractors, search])

  return (
    <main className="min-h-screen bg-secondary/40">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">RoofPitch network</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                Find a roofer you can feel good about hiring.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Browse roofing companies reviewed by our team. See where they work, what they do, and which credentials we have verified.
              </p>
            </div>
            <label className="relative block">
              <span className="sr-only">Search contractors by company, location, or service</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="City, company, or service"
                className="h-14 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-base shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Approved businesses only</span>
            <span className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-primary" /> Verified badges are checked by RoofPitch</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14" aria-labelledby="directory-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="directory-heading" className="font-heading text-2xl font-bold tracking-tight">Roofing contractors</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Loading approved companies…" : `${filtered.length} ${filtered.length === 1 ? "company" : "companies"} listed`}
            </p>
          </div>
          <Link href="/#contractors" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Are you a contractor? Join the network
          </Link>
        </div>

        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-background p-5 text-sm text-destructive">We couldn&apos;t load the directory right now. Please try again.</p>}
        {isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading contractors">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-border bg-background" />)}</div>}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-16 text-center">
            <Building2 className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 font-heading text-lg font-bold">No approved contractors found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try another city or service, or check back as more companies are reviewed.</p>
          </div>
        )}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((contractor) => (
              <Link
                key={contractor.id}
                href={`/contractors/${encodeURIComponent(contractor.id)}`}
                className="group flex min-h-64 flex-col rounded-2xl border border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/50">
                    {contractor.logoUrl ? <img src={contractor.logoUrl} alt={`${contractor.company} logo`} className="size-full object-contain p-1" /> : <Building2 className="size-6 text-muted-foreground" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-heading text-lg font-bold group-hover:text-primary">{contractor.company}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0" aria-hidden="true" />{contractor.serviceArea || "Service area not listed"}</p>
                  </div>
                </div>
                {(contractor.verifiedBusiness || contractor.verifiedIko || contractor.verifiedBp) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contractor.verifiedBusiness && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Business verified</span>}
                    {contractor.verifiedIko && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">IKO ROOFPRO verified</span>}
                    {contractor.verifiedBp && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">BP verified</span>}
                  </div>
                )}
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {contractor.description || `Roofing services in ${contractor.serviceArea || "your area"}.`}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {contractor.specialties.slice(0, 3).map((specialty) => <span key={specialty} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">{specialty}</span>)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
