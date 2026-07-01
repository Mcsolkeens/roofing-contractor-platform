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
/* Resend — real provider                                              */
/* ------------------------------------------------------------------ */

export class ResendProvider implements EmailProvider {
  readonly name = "resend"

  async send(message: EmailMessage): Promise<{ id: string }> {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      throw new Error("RESEND_API_KEY is not set. Add it to .env.local or switch EMAIL_PROVIDER=console.")
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "RoofPitch <noreply@roofpitch.ca>",
        to: message.to,
        subject: message.subject,
        html: message.html,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: a.base64,
        })),
      }),
    })
    if (!res.ok) throw new Error(`Resend send failed (${res.status})`)
    const data = (await res.json()) as { id: string }
    return { id: data.id }
  }
}

/* ------------------------------------------------------------------ */
/* Console — local development provider (logs instead of sending)      */
/* ------------------------------------------------------------------ */

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console"

  async send(message: EmailMessage): Promise<{ id: string }> {
    console.log("[v0] [email] to:", message.to, "| subject:", message.subject)
    if (message.attachments?.length) {
      console.log(
        "[v0] [email] attachments:",
        message.attachments.map((a) => a.filename).join(", "),
      )
    }
    return { id: `console_${Date.now()}` }
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

export function getEmailProvider(): EmailProvider {
  const name = process.env.EMAIL_PROVIDER ?? "console"
  switch (name) {
    case "resend":
      return new ResendProvider()
    case "console":
      return new ConsoleEmailProvider()
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: "${name}"`)
  }
}
