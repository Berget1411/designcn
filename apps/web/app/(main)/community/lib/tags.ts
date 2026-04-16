export const COMMUNITY_PRESET_TAGS = [
  // Aesthetic
  "minimal",
  "playful",
  "corporate",
  "brutalist",
  "retro",
  "futuristic",
  "elegant",
  "bold",
  "soft",
  "warm",
  "cool",
  "high-contrast",
  "monochrome",
  "vibrant",
  "pastel",
  // Use Case
  "dashboard",
  "landing-page",
  "blog",
  "e-commerce",
  "saas",
  "portfolio",
  "documentation",
  "admin",
  "mobile-first",
  "marketing",
  // Design Token
  "serif",
  "mono",
  "sans-serif",
  "rounded",
  "sharp",
  "compact",
  "spacious",
] as const;

export type CommunityPresetTag = (typeof COMMUNITY_PRESET_TAGS)[number];

export const MAX_TAGS_PER_PRESET = 5;
export const COMMUNITY_PAGE_SIZE = 20;
