import type { Metadata } from "next"
import { SandboxTester } from "@/components/eagleview/sandbox-tester"

export const metadata: Metadata = {
  title: "EagleView Sandbox Test | RoofPitch",
  description: "Live end-to-end test of the EagleView Measurement Orders sandbox integration.",
}

export default function EagleViewTestPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-accent">EagleView integration</p>
        <h1 className="mt-1 text-pretty text-3xl font-bold text-foreground">Sandbox connectivity test</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          This runs our EagleView Measurement Orders integration against the sandbox environment using EagleView&apos;s
          pre-loaded sample reports. It authenticates with client credentials, calls the live API, and pulls back real
          report data and files — the working demonstration EagleView asks for before enabling production.
        </p>
      </header>
      <SandboxTester />
    </main>
  )
}
