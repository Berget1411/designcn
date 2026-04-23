/**
 * Feature flags — controlled via environment variables.
 *
 * In production, leave the env vars unset (or set to "false") to disable.
 * In local development, set them to "true" in .env.local.
 */

export const ENABLE_AI = process.env.NEXT_PUBLIC_ENABLE_AI === "true";
export const ENABLE_SUBSCRIPTIONS = process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS === "true";
