import {
  buildRegistryBase,
  getInheritedHeadingFontValue,
  type DesignSystemConfig,
} from "@/registry/config";
import { type CustomThemeVars } from "@/app/create/lib/custom-theme-vars";

export function buildManualComponentsJson(config: DesignSystemConfig) {
  return JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: `${config.base}-${config.style}`,
      tailwind: {
        css: "app/globals.css",
        baseColor: config.baseColor,
      },
      iconLibrary: config.iconLibrary,
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
    },
    null,
    2,
  );
}

export function buildManualGlobalsCss(
  config: DesignSystemConfig,
  customThemeVars: CustomThemeVars = {},
) {
  const registryBase = buildRegistryBase(config, customThemeVars);
  const normalizedFontHeading = config.fontHeading === config.font ? "inherit" : config.fontHeading;

  const lightVars = Object.entries(registryBase.cssVars?.light ?? {})
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");

  const darkVars = Object.entries(registryBase.cssVars?.dark ?? {})
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");

  const fontHeadingValue =
    normalizedFontHeading === "inherit"
      ? getInheritedHeadingFontValue(config.font)
      : "var(--font-heading)";

  return [
    '@import "tailwindcss";',
    '@import "tw-animate-css";',
    '@import "shadcn/tailwind.css";',
    "",
    "@theme inline {",
    "  --font-sans: var(--font-sans);",
    `  --font-heading: ${fontHeadingValue};`,
    "  --font-mono: var(--font-mono);",
    "  --color-background: var(--background);",
    "  --color-foreground: var(--foreground);",
    "  --color-card: var(--card);",
    "  --color-card-foreground: var(--card-foreground);",
    "  --color-popover: var(--popover);",
    "  --color-popover-foreground: var(--popover-foreground);",
    "  --color-primary: var(--primary);",
    "  --color-primary-foreground: var(--primary-foreground);",
    "  --color-secondary: var(--secondary);",
    "  --color-secondary-foreground: var(--secondary-foreground);",
    "  --color-muted: var(--muted);",
    "  --color-muted-foreground: var(--muted-foreground);",
    "  --color-accent: var(--accent);",
    "  --color-accent-foreground: var(--accent-foreground);",
    "  --color-destructive: var(--destructive);",
    "  --color-destructive-foreground: var(--destructive-foreground);",
    "  --color-border: var(--border);",
    "  --color-input: var(--input);",
    "  --color-ring: var(--ring);",
    "  --color-chart-1: var(--chart-1);",
    "  --color-chart-2: var(--chart-2);",
    "  --color-chart-3: var(--chart-3);",
    "  --color-chart-4: var(--chart-4);",
    "  --color-chart-5: var(--chart-5);",
    "  --color-sidebar: var(--sidebar);",
    "  --color-sidebar-foreground: var(--sidebar-foreground);",
    "  --color-sidebar-primary: var(--sidebar-primary);",
    "  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);",
    "  --color-sidebar-accent: var(--sidebar-accent);",
    "  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);",
    "  --color-sidebar-border: var(--sidebar-border);",
    "  --color-sidebar-ring: var(--sidebar-ring);",
    "  --radius-sm: calc(var(--radius) * 0.6);",
    "  --radius-md: calc(var(--radius) * 0.8);",
    "  --radius-lg: var(--radius);",
    "  --radius-xl: calc(var(--radius) * 1.4);",
    "  --radius-2xl: calc(var(--radius) * 1.8);",
    "  --radius-3xl: calc(var(--radius) * 2.2);",
    "  --radius-4xl: calc(var(--radius) * 2.6);",
    "}",
    "",
    ":root {",
    lightVars,
    "}",
    "",
    ".dark {",
    darkVars,
    "}",
    "",
    "@layer base {",
    "  * {",
    "    @apply border-border outline-ring/50;",
    "  }",
    "  body {",
    "    @apply bg-background text-foreground;",
    "  }",
    "}",
  ].join("\n");
}
