"use client"

import { useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, Clock, LogOut, MapPin, Mail, Phone, FileText, Send, Paperclip, RefreshCw } from "lucide-react"
import type { Contractor, ContractorStatus, MeasurementRequest } from "@/lib/workflow/repository"
import type { SentEmail } from "@/lib/providers/email"

type Filter = ContractorStatus | "all"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const filters: { id: Filter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
]

const statusStyles: Record<ContractorStatus, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
}

export function AdminDashboard() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("pending")
  const { data, isLoading, mutate } = useSWR<{
    contractors: Contractor[]
    requests: MeasurementRequest[]
    emails: SentEmail[]
  }>(`/api/admin/contractors?status=${filter}`, fetcher, { refreshInterval: 5000 })

  const [busyId, setBusyId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processMsg, setProcessMsg] = useState<string | null>(null)

  async function processJobs() {
    setProcessing(true)
    setProcessMsg(null)
    try {
      const res = await fetch("/api/admin/process-jobs", { method: "POST" })
      const data = (await res.json()) as { checked?: number; results?: { status: string }[] }
      const ready = (data.results ?? []).filter((r) => r.status === "ready").length
      setProcessMsg(
        `Checked ${data.checked ?? 0} in progress · ${ready} report${ready === 1 ? "" : "s"} delivered.`,
      )
      mutate()
    } catch {
      setProcessMsg("Could not process jobs. Try again.")
    } finally {
      setProcessing(false)
    }
  }

  async function setStatus(id: string, status: ContractorStatus) {
    setBusyId(id)
    await fetch(`/api/admin/contractors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setBusyId(null)
    mutate()
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" })
    router.refresh()
  }

  const contractors = data?.contractors ?? []
  const requests = data?.requests ?? []
  const emails = data?.emails ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Contractor applications</h1>
          <p className="mt-1 text-muted-foreground">
            Review companies that applied to be listed, and approve the ones you trust.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={processJobs} disabled={processing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${processing ? "animate-spin" : ""}`} />
            {processing ? "Processing…" : "Process pending reports"}
          </Button>
          <Button variant="outline" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>
      {processMsg && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{processMsg}</p>
      )}

      {/* Filter tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contractor list */}
      <div className="mt-6 grid gap-4">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {!isLoading && contractors.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No contractors in this view.
          </div>
        )}
        {contractors.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-card p-5 sm:flex sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-heading text-lg font-bold">{c.company}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[c.status]}`}
                >
                  {c.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.contactName}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {c.email}
                </span>
                {c.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> {c.phone}
                  </span>
                )}
                {c.serviceArea && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {c.serviceArea}
                  </span>
                )}
              </div>
              {c.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex shrink-0 gap-2 sm:mt-0 sm:pl-4">
              {c.status !== "approved" && (
                <Button
                  onClick={() => setStatus(c.id, "approved")}
                  disabled={busyId === c.id}
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
              )}
              {c.status !== "rejected" && (
                <Button
                  variant="outline"
                  onClick={() => setStatus(c.id, "rejected")}
                  disabled={busyId === c.id}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
              )}
              {c.status !== "pending" && (
                <Button
                  variant="ghost"
                  onClick={() => setStatus(c.id, "pending")}
                  disabled={busyId === c.id}
                  className="gap-1.5"
                >
                  <Clock className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent homeowner requests */}
      <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight">Recent quote requests</h2>
      <p className="mt-1 text-muted-foreground">
        Measurement requests homeowners have submitted, newest first.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Postal</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Matched</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Report</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No requests yet. Submit one from the homepage to see it here.
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{r.postalCode}</td>
                <td className="px-4 py-3 capitalize">{r.product}</td>
                <td className="px-4 py-3">{r.contractorIds.length}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                    {r.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.reportUrl ? (
                    <div className="flex items-center gap-3">
                      <a
                        href={r.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" /> Report
                      </a>
                      {r.materialsUrl && (
                        <a
                          href={r.materialsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" /> Materials
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sent notifications */}
      <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight">Report emails</h2>
      <p className="mt-1 text-muted-foreground">
        Roof reports delivered to the RoofPitch inbox, newest first.{" "}
        {emails.length === 0
          ? ""
          : emails[0].provider === "console"
            ? "Running in simulation mode — add RESEND_API_KEY to send real email."
            : "Delivering via Resend."}
      </p>
      <div className="mt-4 grid gap-3">
        {emails.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No notifications sent yet.
          </div>
        )}
        {emails.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                <Send className="h-4 w-4 text-primary" />
                {m.subject}
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  m.delivered ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                }`}
              >
                {m.delivered ? "sent" : "failed"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              To: {m.to.join(", ")} · {new Date(m.sentAt).toLocaleString("en-CA")}
            </p>
            {m.attachments.length > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" /> {m.attachments.join(", ")}
              </p>
            )}
            {m.note && <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
