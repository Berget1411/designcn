export type ThemeVarMode = "light" | "dark"

export type CustomThemeVars = Partial<
  Record<ThemeVarMode, Record<string, string>>
>

function sanitizeModeVars(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const entries = Object.entries(value).filter(
    ([key, entryValue]) =>
      Boolean(key) &&
      typeof entryValue === "string" &&
      entryValue.trim().length > 0
  )

  if (entries.length === 0) {
    return undefined
  }

  return Object.fromEntries(
    entries.map(([key, entryValue]) => [key, entryValue.trim()])
  )
}

export function normalizeCustomThemeVars(value: unknown): CustomThemeVars {
  if (!value || typeof value !== "object") {
    return {}
  }

  const light = sanitizeModeVars((value as CustomThemeVars).light)
  const dark = sanitizeModeVars((value as CustomThemeVars).dark)

  return {
    ...(light ? { light } : {}),
    ...(dark ? { dark } : {}),
  }
}

export function decodeCustomThemeVars(value?: string | null): CustomThemeVars {
  if (!value) {
    return {}
  }

  try {
    return normalizeCustomThemeVars(JSON.parse(value))
  } catch {
    return {}
  }
}

export function encodeCustomThemeVars(value: CustomThemeVars) {
  const normalized = normalizeCustomThemeVars(value)

  if (!normalized.light && !normalized.dark) {
    return null
  }

  return JSON.stringify(normalized)
}

export function hasCustomThemeVars(value: CustomThemeVars) {
  return Boolean(value.light || value.dark)
}
