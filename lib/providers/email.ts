/**
 * Email provider abstraction.
 *
 * The app sends mail through the `EmailProvider` interface via `getEmailProvider()`.
 * Swapping Resend for SendGrid / SES means writing one class and adding one case
 * to the factory below — no caller changes.
 */

export interface EmailAttachment {
  filename: string
  base64: string
  contentType: string
}

export interface EmailMessage {
  to: string | string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage): Promise<{ id: string }>
}

/* ------------------------------------------------------------------ */
/* Sent-mail log (so the admin can see what went out during a demo)    */
/* ------------------------------------------------------------------ */

export interface SentEmail {
  id: string
  to: string[]
  subject: string
  html: string
  attachments: string[]
  provider: string
  delivered: boolean
  note?: string
  sentAt: string
}

const sentLog: SentEmail[] = []

function recordEmail(entry: SentEmail) {
  sentLog.unshift(entry)
  if (sentLog.length > 100) sentLog.pop()
}

/** Most recent sent emails, newest first. Used by the admin dashboard. */
export function getRecentEmails(limit = 50): SentEmail[] {
  return sentLog.slice(0, limit)
}

/* ------------------------------------------------------------------ */
/* Resend — real provider                                              */
/* ------------------------------------------------------------------ */

export class ResendProvider implements EmailProvider {
  readonly name = "resend"

  async send(message: EmailMessage): Promise<{ id: string }> {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      throw new Error("RESEND_API_KEY is not set. Add it to .env.local or switch EMAIL_PROVIDER=console.")
    }
    const to = Array.isArray(message.to) ? message.to : [message.to]
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "RoofPitch <onboarding@resend.dev>",
        to: message.to,
        subject: message.subject,
        html: message.html,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: a.base64,
        })),
      }),
    })
    const ok = res.ok
    const detail = ok ? "" : await res.text().catch(() => "")
    const data = ok ? ((await res.json()) as { id: string }) : { id: `resend_err_${Date.now()}` }
    recordEmail({
      id: data.id,
      to,
      subject: message.subject,
      html: message.html,
      attachments: (message.attachments ?? []).map((a) => a.filename),
      provider: this.name,
      delivered: ok,
      note: ok ? "Delivered via Resend" : `Resend error ${res.status}: ${detail.slice(0, 200)}`,
      sentAt: new Date().toISOString(),
    })
    if (!ok) throw new Error(`Resend send failed (${res.status}). ${detail.slice(0, 200)}`)
    return { id: data.id }
  }
}

/* ------------------------------------------------------------------ */
/* Console — local development provider (logs instead of sending)      */
/* ------------------------------------------------------------------ */

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console"

  async send(message: EmailMessage): Promise<{ id: string }> {
    const to = Array.isArray(message.to) ? message.to : [message.to]
    const id = `sim_${Date.now()}_${Math.floor(Math.random() * 1e4)}`
    console.log("[v0] [email] (simulated) to:", to.join(", "), "| subject:", message.subject)
    recordEmail({
      id,
      to,
      subject: message.subject,
      html: message.html,
      attachments: (message.attachments ?? []).map((a) => a.filename),
      provider: this.name,
      delivered: true,
      note: "Simulated — no external email service configured. Set RESEND_API_KEY to send real email.",
      sentAt: new Date().toISOString(),
    })
    return { id }
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

export function getEmailProvider(): EmailProvider {
  // "auto" (default): use Resend when a key is configured, otherwise simulate.
  // This keeps the demo working with zero setup while allowing real delivery
  // the moment RESEND_API_KEY is added.
  const name = process.env.EMAIL_PROVIDER ?? "auto"
  switch (name) {
    case "resend":
      return new ResendProvider()
    case "console":
      return new ConsoleEmailProvider()
    case "auto":
      return process.env.RESEND_API_KEY ? new ResendProvider() : new ConsoleEmailProvider()
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: "${name}"`)
  }
}
