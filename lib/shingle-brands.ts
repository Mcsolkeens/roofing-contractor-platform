/**
 * Shingle manufacturers, product lines and colours for the homeowner form.
 *
 * Homeowner picks: manufacturer (IKO or BP) -> product line -> colour.
 *
 * IKO — Dynasty and Cambridge. Colours mirror the real IKO lineups; the `image`
 * points at the generated shingle close-ups in /public/shingles/<line>/<slug>.png.
 *
 * BP — Signature and Mystique (2 of BP's 4 shingle lines; Vangard and Yukon are
 * intentionally not offered). Colour NAMES and COUNTS are taken directly from
 * bpcan.com, and each `hex` is the averaged pixel colour sampled from that
 * colour's own swatch image on BP's product page — not an assumed palette.
 * Every BP colour also has a real shingle close-up mirrored from bpcan.com into
 * /public/shingles/<line>/, so BP renders actual roof imagery exactly like IKO
 * (the `hex` now only acts as a loading/fallback tint behind the photo).
 *   Signature: 12 colours  https://bpcan.com/produits/signature-east/
 *   Mystique:   9 colours  https://bpcan.com/produits/mystique-shingles/
 */

export interface ShingleColor {
  id: string
  label: string
  hex: string
  /** Close-up shingle photo. Set for every IKO and BP colour. */
  image?: string
}

export interface ShingleLine {
  id: string
  name: string
  tagline: string
  url: string
  /** Optional hero photo. Absent lines fall back to a colour-strip preview. */
  hero?: string
  colors: ShingleColor[]
}

export interface Manufacturer {
  id: string
  name: string
  blurb: string
  lines: ShingleLine[]
}

export const manufacturers: Manufacturer[] = [
  {
    id: "iko",
    name: "IKO",
    blurb: "North American shingles with strong wind and impact ratings.",
    lines: [
      {
        id: "dynasty",
        name: "Dynasty Performance Shingles",
        tagline: "Class 3 impact rating, wide ArmourZone nailing, high-wind protection.",
        url: "https://www.iko.com/na/product/dynasty/",
        hero: "/shingles/dynasty/granite-black.png",
        colors: [
          { id: "granite-black", label: "Granite Black", hex: "#23252a", image: "/shingles/dynasty/granite-black.png" },
          { id: "summit-grey", label: "Summit Grey", hex: "#6e7378", image: "/shingles/dynasty/summit-grey.png" },
          { id: "frostone-grey", label: "Frostone Grey", hex: "#9a9ea1", image: "/shingles/dynasty/frostone-grey.png" },
          { id: "shadow-brown", label: "Shadow Brown", hex: "#3f3128", image: "/shingles/dynasty/shadow-brown.png" },
          { id: "brownstone", label: "Brownstone", hex: "#6b5540", image: "/shingles/dynasty/brownstone.png" },
          { id: "weatherwood", label: "Olde Style Weatherwood", hex: "#7d7263", image: "/shingles/dynasty/weatherwood.png" },
          { id: "emerald-green", label: "Emerald Green", hex: "#2f4636", image: "/shingles/dynasty/emerald-green.png" },
          { id: "monaco-red", label: "Monaco Red", hex: "#5c2b29", image: "/shingles/dynasty/monaco-red.png" },
        ],
      },
      {
        id: "cambridge",
        name: "Cambridge Architectural Shingles",
        tagline: "The look of natural texture with fiberglass strength and algae resistance.",
        url: "https://www.iko.com/na/product/cambridge/",
        hero: "/shingles/cambridge/dual-black.png",
        colors: [
          { id: "dual-black", label: "Dual Black", hex: "#26262a", image: "/shingles/cambridge/dual-black.png" },
          { id: "charcoal-grey", label: "Charcoal Grey", hex: "#3d4044", image: "/shingles/cambridge/charcoal-grey.png" },
          { id: "dual-grey", label: "Dual Grey", hex: "#74777b", image: "/shingles/cambridge/dual-grey.png" },
          { id: "weatherwood", label: "Weatherwood", hex: "#7b7264", image: "/shingles/cambridge/weatherwood.png" },
          { id: "driftwood", label: "Driftwood", hex: "#8b7e69", image: "/shingles/cambridge/driftwood.png" },
          { id: "earthtone-cedar", label: "Earthtone Cedar", hex: "#6d4f38", image: "/shingles/cambridge/earthtone-cedar.png" },
          { id: "dual-brown", label: "Dual Brown", hex: "#4c3a2d", image: "/shingles/cambridge/dual-brown.png" },
          { id: "harvard-slate", label: "Harvard Slate", hex: "#494d52", image: "/shingles/cambridge/harvard-slate.png" },
        ],
      },
    ],
  },
  {
    id: "bp",
    name: "BP",
    blurb: "Canadian-made shingles with Weather-Tite adhesive technology.",
    lines: [
      {
        id: "signature",
        name: "Signature",
        tagline: "220 km/h wind warranty, Class 3 impact, 12 curated designer colours.",
        url: "https://bpcan.com/produits/signature-east/",
        hero: "/shingles/signature/arabica.webp",
        colors: [
          { id: "arabica", label: "Arabica", hex: "#342f2d", image: "/shingles/signature/arabica.webp" },
          { id: "mesquite", label: "Mesquite", hex: "#523f35", image: "/shingles/signature/mesquite.webp" },
          { id: "criollo", label: "Criollo", hex: "#333033", image: "/shingles/signature/criollo.webp" },
          { id: "fjord", label: "Fjord", hex: "#605e5c", image: "/shingles/signature/fjord.webp" },
          { id: "cumin", label: "Cumin", hex: "#292727", image: "/shingles/signature/cumin.webp" },
          { id: "dublin", label: "Dublin", hex: "#615650", image: "/shingles/signature/dublin.webp" },
          { id: "muskoka", label: "Muskoka", hex: "#4c4944", image: "/shingles/signature/muskoka.webp" },
          { id: "cortina", label: "Cortina", hex: "#565251", image: "/shingles/signature/cortina.webp" },
          { id: "newport", label: "Newport", hex: "#636160", image: "/shingles/signature/newport.webp" },
          { id: "quinoa", label: "Quinoa", hex: "#5c4d42", image: "/shingles/signature/quinoa.webp" },
          { id: "soho", label: "Soho", hex: "#3f3937", image: "/shingles/signature/soho.webp" },
          { id: "toscana", label: "Toscana", hex: "#5f4e43", image: "/shingles/signature/toscana.webp" },
        ],
      },
      {
        id: "mystique",
        name: "Mystique",
        tagline: "Affordable double-layer laminate shingle that protects resale value.",
        url: "https://bpcan.com/produits/mystique-shingles/",
        hero: "/shingles/mystique/slate-grey.png",
        colors: [
          { id: "slate-grey", label: "Slate Grey", hex: "#6f7571", image: "/shingles/mystique/slate-grey.png" },
          { id: "rustic-cedar", label: "Rustic Cedar", hex: "#726557", image: "/shingles/mystique/rustic-cedar.png" },
          { id: "classic-brown", label: "Classic Brown", hex: "#61524f", image: "/shingles/mystique/classic-brown.png" },
          { id: "barkwood", label: "Barkwood", hex: "#756b64", image: "/shingles/mystique/barkwood.png" },
          { id: "antique-slate", label: "Antique Slate", hex: "#74706c", image: "/shingles/mystique/antique-slate.png" },
          { id: "2-tone-brown", label: "2-Tone Brown", hex: "#75594f", image: "/shingles/mystique/2-tone-brown.png" },
          { id: "2-tone-black", label: "2-Tone Black", hex: "#565558", image: "/shingles/mystique/2-tone-black.png" },
          { id: "morning-mist", label: "Morning Mist", hex: "#7b7a7e", image: "/shingles/mystique/morning-mist.jpg" },
          { id: "sangria", label: "Sangria", hex: "#473330", image: "/shingles/mystique/sangria.jpg" },
        ],
      },
    ],
  },
]

export function findManufacturer(id: string | null): Manufacturer | null {
  if (!id) return null
  return manufacturers.find((m) => m.id === id) ?? null
}

export function findLine(manufacturerId: string | null, lineId: string | null): ShingleLine | null {
  if (!lineId) return null
  return findManufacturer(manufacturerId)?.lines.find((l) => l.id === lineId) ?? null
}
