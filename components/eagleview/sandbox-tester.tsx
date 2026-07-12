"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SANDBOX_SAMPLES, DEFAULT_SANDBOX_REPORT_ID } from "@/lib/eagleview-sandbox"

interface Step {
  name: string
  ok: boolean
  detail: string
  data?: unknown
}

interface TestResult {
  ok: boolean
  configured: boolean
  message?: string
  reportId?: string
  steps?: Step[]
}

export function SandboxTester() {
  const [reportId, setReportId] = useState(DEFAULT_SANDBOX_REPORT_ID)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [openStep, setOpenStep] = useState<number | null>(null)

  async function runTest() {
    setLoading(true)
    setResult(null)
    setOpenStep(null)
    try {
      const res = await fetch(`/api/eagleview/sandbox-test?reportId=${encodeURIComponent(reportId)}`)
      setResult((await res.json()) as TestResult)
    } catch (err) {
      setResult({ ok: false, configured: true, message: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="rounded-lg border border-border bg-card p-5">
        <label htmlFor="sample" className="mb-2 block text-sm font-medium text-card-foreground">
          Sandbox sample report
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            id="sample"
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {SANDBOX_SAMPLES.map((s) => (
              <option key={s.reportId} value={s.reportId}>
                {s.label} — {s.address}
              </option>
            ))}
          </select>
          <Button onClick={runTest} disabled={loading} className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? "Running live test…" : "Run live sandbox test"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Calls EagleView&apos;s sandbox (report {reportId}) end to end: authenticate, list products, fetch the report,
          and download the roof PDF.
        </p>
      </div>

      {/* Not configured */}
      {result && !result.configured && (
        <div className="rounded-lg border border-border bg-muted p-5 text-sm text-muted-foreground">
          {result.message}
        </div>
      )}

      {/* Overall banner */}
      {result?.configured && result.steps && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            result.ok
              ? "border-accent/40 bg-accent/10 text-accent-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {result.ok
            ? "All steps passed — the integration is talking to EagleView's sandbox and returning real data."
            : "Some steps failed. Expand the failed step below for the exact error."}
        </div>
      )}

      {/* Steps */}
      {result?.steps && (
        <ol className="flex flex-col gap-3">
          {result.steps.map((step, i) => (
            <li key={step.name} className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      step.ok ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {step.ok ? "✓" : "✕"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
                {step.data != null && (
                  <button
                    type="button"
                    onClick={() => setOpenStep(openStep === i ? null : i)}
                    className="shrink-0 text-xs font-medium text-accent underline-offset-2 hover:underline"
                  >
                    {openStep === i ? "Hide data" : "View data"}
                  </button>
                )}
              </div>
              {openStep === i && step.data != null && (
                <pre className="max-h-80 overflow-auto border-t border-border bg-muted p-4 text-xs text-muted-foreground">
                  {JSON.stringify(step.data, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* File links */}
      {result?.ok && (
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/eagleview/sandbox-file?reportId=${reportId}&kind=pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted"
          >
            Open Roof report PDF
          </a>
          <a
            href={`/api/eagleview/sandbox-file?reportId=${reportId}&kind=json`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted"
          >
            Open measurement JSON
          </a>
        </div>
      )}
    </div>
  )
}
