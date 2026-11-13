import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ContractorDirectory } from "@/components/contractor-directory"

export const metadata: Metadata = {
  title: "Find a Roofing Contractor — RoofPitch",
  description: "Browse RoofPitch-approved roofing companies, compare their services, and see credentials verified by our team.",
}

export default function ContractorsPage() {
  return (
    <>
      <SiteHeader />
      <ContractorDirectory />
      <SiteFooter />
    </>
  )
}
