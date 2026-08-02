// IKO shingle brand + color data for the homeowner form's shingles flow.
// Colors mirror the real IKO Dynasty and Cambridge lineups. The `hex` values are
// used for swatch borders / loading placeholders; the actual look comes from the
// generated shingle images in /public/shingles/<brand>/<slug>.png.

export interface ShingleColor {
  id: string
  label: string
  hex: string
  image: string
}

export interface ShingleBrand {
  id: string
  name: string
  tagline: string
  url: string
  hero: string
  colors: ShingleColor[]
}

export const shingleBrands: ShingleBrand[] = [
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
]
