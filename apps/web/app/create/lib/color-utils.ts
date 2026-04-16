"use client"

let colorProbe: HTMLDivElement | null = null
const colorCache = new Map<string, string | null>()

function getColorProbe() {
  if (typeof document === "undefined") {
    return null
  }

  if (!colorProbe) {
    colorProbe = document.createElement("div")
    colorProbe.setAttribute("aria-hidden", "true")
    colorProbe.style.position = "fixed"
    colorProbe.style.inset = "0"
    colorProbe.style.opacity = "0"
    colorProbe.style.pointerEvents = "none"
    document.body.appendChild(colorProbe)
  }

  return colorProbe
}

function rgbToHex(value: string) {
  const match = value.match(
    /rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i
  )

  if (!match) {
    return null
  }

  return `#${match
    .slice(1, 4)
    .map((channel) =>
      Number(channel).toString(16).padStart(2, "0").toLowerCase()
    )
    .join("")}`
}

/**
 * Convert any CSS color value (hex, OKLCH, rgb, named, etc.) to a
 * 6-digit hex string suitable for `<input type="color">`.
 * Returns `null` when the value isn't a recognizable CSS color.
 */
export function cssColorToHex(value: string): string | null {
  if (!value) {
    return null
  }

  const cached = colorCache.get(value)
  if (cached !== undefined) {
    return cached
  }

  if (/^#[\da-f]{6}$/i.test(value)) {
    const normalized = value.toLowerCase()
    colorCache.set(value, normalized)
    return normalized
  }

  if (/^#[\da-f]{3}$/i.test(value)) {
    const [, r, g, b] = value
    const normalized = `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
    colorCache.set(value, normalized)
    return normalized
  }

  const probe = getColorProbe()
  if (!probe) {
    return null
  }

  probe.style.color = ""
  probe.style.color = value

  if (!probe.style.color) {
    colorCache.set(value, null)
    return null
  }

  const normalized = rgbToHex(getComputedStyle(probe).color)
  colorCache.set(value, normalized)

  return normalized
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function componentToHex(c: number) {
  return Math.max(0, Math.min(255, Math.round(c)))
    .toString(16)
    .padStart(2, "0")
}

/**
 * Mix a hex color toward white by `amount` (0–1).
 * amount=0 → original, amount=1 → white.
 */
export function lightenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${componentToHex(r + (255 - r) * amount)}${componentToHex(g + (255 - g) * amount)}${componentToHex(b + (255 - b) * amount)}`
}

/**
 * Mix a hex color toward black by `amount` (0–1).
 * amount=0 → original, amount=1 → black.
 */
export function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${componentToHex(r * (1 - amount))}${componentToHex(g * (1 - amount))}${componentToHex(b * (1 - amount))}`
}

/**
 * Generate chart-1 through chart-5 from a single picked hex color.
 * Follows the existing theme pattern: chart-1 = lightest, chart-5 = darkest.
 * The picked color becomes chart-2 (the primary visible one);
 * chart-1 is a lighter tint, chart-3–5 progressively darker.
 */
export function generateChartPalette(hex: string): Record<string, string> {
  return {
    "chart-1": lightenHex(hex, 0.35),
    "chart-2": hex,
    "chart-3": darkenHex(hex, 0.18),
    "chart-4": darkenHex(hex, 0.35),
    "chart-5": darkenHex(hex, 0.50),
  }
}
