import { NextResponse } from "next/server"
import { getPaymentProvider } from "@/lib/providers/payment"

export const runtime = "nodejs"

/**
 * Payment seam. Whichever provider is configured (Stripe today, Square/Moneris
 * later) is created through the factory — this handler never changes.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, currency = "cad", description = "RoofPitch", customerEmail } = body ?? {}

    if (!amount) {
      return NextResponse.json({ error: "amount is required" }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const payment = getPaymentProvider()
    const session = await payment.createCheckoutSession({
      amount,
      currency,
      description,
      customerEmail,
      successUrl: `${origin}/?checkout=success`,
      cancelUrl: `${origin}/?checkout=cancelled`,
    })

    return NextResponse.json(session)
  } catch (err) {
    console.log("[v0] [api/checkout] error:", (err as Error).message)
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 })
  }
}
