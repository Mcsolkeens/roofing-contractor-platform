/**
 * Quote scope — what the homeowner wants quoted, and how that maps onto the
 * EagleView report we order.
 *
 * This is the ONLY place the scope -> EagleView product mapping lives. The
 * homeowner form collects the scope, the workflow passes it through, and the
 * measurement provider reads the resolved product ids from here.
 *
 * Mapping rules (per product owner):
 *   - Every selection orders the normal comprehensive report: product 31
 *     ("Premium - Residential" — 3D roof diagram, all critical measurements,
 *     and a waste calculation table).
 *   - The moment SIDING is included, the siding add-on is added on top.
 *   - Roof / soffit / fascia / eavestrough on their own (in any combination)
 *     order the normal report with NO add-ons.
 */

export type QuoteScopeId = "roof" | "siding" | "soffit" | "fascia" | "eavestrough"

export interface QuoteScopeOption {
  id: QuoteScopeId
  label: string
  desc: string
}

/** The five things a homeowner can ask us to quote. Order is the display order. */
export const quoteScopeOptions: QuoteScopeOption[] = [
  { id: "roof", label: "Roof", desc: "Shingles, underlay and flashing" },
  { id: "siding", label: "Siding", desc: "Exterior wall cladding" },
  { id: "soffit", label: "Soffit", desc: "Underside of the roof overhang" },
  { id: "fascia", label: "Fascia", desc: "Trim board along the roof edge" },
  { id: "eavestrough", label: "Eavestrough", desc: "Gutters and downspouts" },
]

const SCOPE_IDS = new Set<string>(quoteScopeOptions.map((o) => o.id))

/**
 * EagleView "Premium - Residential" — the comprehensive roof report. Verified
 * present in the live production catalog (GetAvailableProducts).
 */
export const EAGLEVIEW_BASE_PRODUCT_ID = Number(process.env.EAGLEVIEW_PRODUCT_ID ?? 31)

/**
 * Add-on ordered when siding is part of the scope, sent as
 * `OrderReports.AddOnProductIds` (an integer array, per the Measurement Order
 * API schema).
 *
 * NOTE: 87 is the id we were given for the siding add-on. It has not yet been
 * confirmed against the live add-on catalogue for product 31, so it is
 * overridable via EAGLEVIEW_SIDING_ADDON_ID without a code change.
 */
export const EAGLEVIEW_SIDING_ADDON_ID = Number(process.env.EAGLEVIEW_SIDING_ADDON_ID ?? 87)

export interface ResolvedEagleViewProducts {
  primaryProductId: number
  /** Empty unless siding is in scope. */
  addOnProductIds: number[]
}

/** Keeps only recognised scope ids, de-duplicated, in canonical display order. */
export function normalizeScopes(scopes: readonly string[] | undefined): QuoteScopeId[] {
  if (!scopes?.length) return []
  const picked = new Set(scopes.filter((s) => SCOPE_IDS.has(s)))
  return quoteScopeOptions.filter((o) => picked.has(o.id)).map((o) => o.id)
}

/**
 * Resolve the EagleView products for a scope selection. Siding is the only
 * scope that changes the order — it adds the siding add-on to the base report.
 */
export function resolveEagleViewProducts(
  scopes: readonly string[] | undefined,
): ResolvedEagleViewProducts {
  const normalized = normalizeScopes(scopes)
  return {
    primaryProductId: EAGLEVIEW_BASE_PRODUCT_ID,
    addOnProductIds: normalized.includes("siding") ? [EAGLEVIEW_SIDING_ADDON_ID] : [],
  }
}

/** Human-readable scope summary for emails, the admin dashboard and the PDF. */
export function formatScopes(scopes: readonly string[] | undefined): string {
  const normalized = normalizeScopes(scopes)
  if (!normalized.length) return ""
  const byId = new Map(quoteScopeOptions.map((o) => [o.id, o.label]))
  return normalized.map((id) => byId.get(id) ?? id).join(", ")
}
