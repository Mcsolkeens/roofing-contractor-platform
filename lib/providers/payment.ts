/**
 * Payment provider abstraction.
 *
 * Callers use the `PaymentProvider` interface via `getPaymentProvider()`.
 * Swapping Stripe for Square / Moneris is a new class + one factory case.
 */

export type PaymentStatus = "paid" | "unpaid" | "expired"

export interface CheckoutParams {
  /** Amount in the smallest currency unit (e.g. cents). */
  amount: number
  currency: string
  description: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}

export interface CheckoutSession {
  id: string
  url: string
}

export interface PaymentProvider {
  readonly name: string
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>
  getPaymentStatus(sessionId: string): Promise<PaymentStatus>
}

/* ------------------------------------------------------------------ */
/* Stripe — real provider                                              */
/* ------------------------------------------------------------------ */

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe"

  private key(): string {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local or switch PAYMENT_PROVIDER=mock.")
    }
    return key
  }

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession> {
    // Stripe's API is form-encoded.
    const form = new URLSearchParams()
    form.set("mode", "payment")
    form.set("success_url", params.successUrl)
    form.set("cancel_url", params.cancelUrl)
    form.set("line_items[0][quantity]", "1")
    form.set("line_items[0][price_data][currency]", params.currency)
    form.set("line_items[0][price_data][unit_amount]", String(params.amount))
    form.set("line_items[0][price_data][product_data][name]", params.description)
    if (params.customerEmail) form.set("customer_email", params.customerEmail)

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    })
    if (!res.ok) throw new Error(`Stripe createCheckoutSession failed (${res.status})`)
    const data = (await res.json()) as { id: string; url: string }
    return { id: data.id, url: data.url }
  }

  async getPaymentStatus(sessionId: string): Promise<PaymentStatus> {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${this.key()}` },
    })
    if (!res.ok) throw new Error(`Stripe getPaymentStatus failed (${res.status})`)
    const data = (await res.json()) as { payment_status: string; status: string }
    if (data.payment_status === "paid") return "paid"
    if (data.status === "expired") return "expired"
    return "unpaid"
  }
}

/* ------------------------------------------------------------------ */
/* Mock — local development provider                                   */
/* ------------------------------------------------------------------ */

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock"

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession> {
    const id = `mock_cs_${Date.now()}`
    console.log("[v0] [payment] mock checkout for:", params.description, params.amount, params.currency)
    // Redirect straight to the success URL so local flows complete.
    return { id, url: params.successUrl }
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    return "paid"
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock"
  switch (name) {
    case "stripe":
      return new StripeProvider()
    case "mock":
      return new MockPaymentProvider()
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: "${name}"`)
  }
}
