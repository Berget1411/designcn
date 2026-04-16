import { parsePresetInput } from "@/app/create/lib/parse-preset-input"

type OpenConfigInput =
  | {
      type: "preset"
      preset: string
    }
  | {
      type: "query"
      query: string
    }

const CONFIG_PARAM_KEYS = new Set([
  "preset",
  "base",
  "previewBase",
  "item",
  "iconLibrary",
  "style",
  "theme",
  "chartColor",
  "font",
  "fontHeading",
  "baseColor",
  "menuAccent",
  "menuColor",
  "radius",
  "vars",
  "template",
  "rtl",
  "size",
  "custom",
])

function hasConfigParams(searchParams: URLSearchParams) {
  return Array.from(searchParams.keys()).some((key) =>
    CONFIG_PARAM_KEYS.has(key)
  )
}

function normalizeQueryInput(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith("?")) {
    return trimmed.slice(1)
  }

  if (trimmed.startsWith("/create?")) {
    return trimmed.slice("/create?".length)
  }

  if (/^[^=\s?#&]+=.*/.test(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    if (!hasConfigParams(url.searchParams)) {
      return null
    }

    return url.search.startsWith("?") ? url.search.slice(1) : url.search
  } catch {
    return null
  }
}

export function parseOpenConfigInput(value: string): OpenConfigInput | null {
  const preset = parsePresetInput(value)
  if (preset) {
    return {
      type: "preset",
      preset,
    }
  }

  const query = normalizeQueryInput(value)
  if (!query) {
    return null
  }

  const searchParams = new URLSearchParams(query)
  if (!hasConfigParams(searchParams)) {
    return null
  }

  return {
    type: "query",
    query: searchParams.toString(),
  }
}
