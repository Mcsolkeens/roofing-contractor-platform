import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BadgeCheck, Building2, CalendarDays, CheckCircle2, Globe2, MapPin, ShieldCheck } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getContractorRepository } from "@/lib/workflow/repository"
import { toPublicContractor } from "@/lib/public-contractors"

interface ContractorPageProps {
  params: Promise<{ id: string }>
}

async function loadApprovedContractor(id: string) {
  const contractor = await getContractorRepository().getById(id)
  return contractor?.status === "approved" ? toPublicContractor(contractor) : undefined
}

export async function generateMetadata({ params }: ContractorPageProps): Promise<Metadata> {
  const { id } = await params
  const contractor = await loadApprovedContractor(id)
  if (!contractor) return { title: "Contractor not found — RoofPitch" }
  return {
    title: `${contractor.company} — RoofPitch approved roofer`,
    description: contractor.description || `${contractor.company} provides roofing services in ${contractor.serviceArea}.`,
  }
}

const credentials: { key: "verifiedIko" | "verifiedBp" | "verifiedInsurance" | "verifiedWsib"; label: string }[] = [
  { key: "verifiedIko", label: "IKO ROOFPRO" },
  { key: "verifiedBp", label: "BP Certified Roofer" },
  { key: "verifiedInsurance", label: "Insurance" },
  { key: "verifiedWsib", label: "WSIB / workplace coverage" },
]

export default async function ContractorProfilePage({ params }: ContractorPageProps) {
  const { id } = await params
  const contractor = await loadApprovedContractor(id)
  if (!contractor) notFound()

  const verifiedCredentials = credentials.filter((credential) => contractor[credential.key])

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <Link href="/contractors" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> All contractors
          </Link>
          <article className="mt-6 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            <div className="p-6 sm:p-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary/50">
                  {contractor.logoUrl ? <img src={contractor.logoUrl} alt={`${contractor.company} logo`} className="size-full object-contain p-2" /> : <Building2 className="size-9 text-muted-foreground" aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{contractor.company}</h1>
                  <p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="size-4 shrink-0" aria-hidden="true" />Roofing · {contractor.serviceArea || "Service area not listed"}, {contractor.province}</p>
                  {contractor.yearEstablished && <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />Established {contractor.yearEstablished}</p>}
                  {contractor.properties.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Serving {contractor.properties.map((property) => property.toLocaleLowerCase()).join(" and ")} properties</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contractor.verifiedBusiness && <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"><ShieldCheck className="size-4" aria-hidden="true" />Business verified</span>}
                    {contractor.verifiedIko && <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"><BadgeCheck className="size-4" aria-hidden="true" />IKO ROOFPRO verified</span>}
                    {contractor.verifiedBp && <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"><BadgeCheck className="size-4" aria-hidden="true" />BP verified</span>}
                  </div>
                </div>
              </div>

              {contractor.description && <p className="mt-7 border-b border-border pb-7 text-lg leading-relaxed">{contractor.description}</p>}

              <section className="grid gap-8 py-7 sm:grid-cols-2" aria-label="Contractor profile details">
                <div>
                  <h2 className="font-heading text-xl font-bold">Services and expertise</h2>
                  {contractor.specialties.length > 0 || contractor.roofWork.length > 0 || contractor.roofTypes.length > 0 ? (
                    <div className="mt-4 grid gap-4">
                      {contractor.specialties.length > 0 && <div><h3 className="text-sm font-semibold text-muted-foreground">Exterior services</h3><ul className="mt-2 flex flex-wrap gap-2">{contractor.specialties.map((item) => <li key={item} className="rounded-md bg-secondary px-3 py-1.5 text-sm capitalize">{item}</li>)}</ul></div>}
                      {contractor.roofWork.length > 0 && <div><h3 className="text-sm font-semibold text-muted-foreground">Roofing work</h3><ul className="mt-2 flex flex-wrap gap-2">{contractor.roofWork.map((item) => <li key={item} className="rounded-md bg-secondary px-3 py-1.5 text-sm">{item}</li>)}</ul></div>}
                      {contractor.roofTypes.length > 0 && <div><h3 className="text-sm font-semibold text-muted-foreground">Roof types</h3><ul className="mt-2 flex flex-wrap gap-2">{contractor.roofTypes.map((item) => <li key={item} className="rounded-md bg-secondary px-3 py-1.5 text-sm">{item}</li>)}</ul></div>}
                    </div>
                  ) : <p className="mt-3 text-sm text-muted-foreground">Service details will be updated soon.</p>}
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">Professional credentials</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Only credentials reviewed and confirmed by RoofPitch are shown as verified.</p>
                  {verifiedCredentials.length > 0 ? <ul className="mt-4 grid gap-2">{verifiedCredentials.map((credential) => <li key={credential.key} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />{credential.label} verified</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No additional professional credentials have been verified yet.</p>}
                </div>
              </section>

              {(contractor.warranty || contractor.cleanup || contractor.availability) && <section className="border-t border-border py-7"><h2 className="font-heading text-xl font-bold">Project details</h2><dl className="mt-4 grid gap-4 sm:grid-cols-3">{contractor.availability && <div><dt className="text-sm text-muted-foreground">Availability</dt><dd className="mt-1 text-sm font-medium">{contractor.availability}</dd></div>}{contractor.warranty && <div><dt className="text-sm text-muted-foreground">Workmanship warranty</dt><dd className="mt-1 text-sm font-medium">{contractor.warranty}</dd></div>}{contractor.cleanup && <div><dt className="text-sm text-muted-foreground">Job-site cleanup</dt><dd className="mt-1 text-sm font-medium">{contractor.cleanup}</dd></div>}</dl></section>}

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
                <a href="/#get-matched" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Get matched with roofers</a>
                {contractor.website && <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-secondary"><Globe2 className="size-4" aria-hidden="true" />Visit company website<span className="sr-only"> (opens in a new tab)</span></a>}
              </div>
            </div>
          </article>
          <p className="mt-4 text-center text-xs text-muted-foreground">RoofPitch business review is not a guarantee of workmanship quality. Homeowners should confirm project details directly.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
