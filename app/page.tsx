import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { StatsBand } from "@/components/stats-band"
import { HowItWorks } from "@/components/how-it-works"
import { HomeownerQuiz } from "@/components/homeowner-quiz"
import { ContractorRegister } from "@/components/contractor-register"
import { Faq } from "@/components/faq"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <StatsBand />
        <HowItWorks />
        <HomeownerQuiz />
        <ContractorRegister />
        <Faq />
      </main>
      <SiteFooter />
    </>
  )
}
