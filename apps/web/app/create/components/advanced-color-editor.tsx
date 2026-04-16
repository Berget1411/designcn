"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  decodeCustomThemeVars,
  encodeCustomThemeVars,
  type ThemeVarMode,
} from "@/app/create/lib/custom-theme-vars";
import {
  type DesignSystemSearchParams,
  useDesignSystemSearchParams,
} from "@/app/create/lib/search-params";
import { buildRegistryTheme } from "@/registry/config";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

type ColorTokenKey =
  | "background"
  | "foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "accent"
  | "accent-foreground"
  | "muted"
  | "muted-foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "destructive"
  | "destructive-foreground"
  | "border"
  | "input"
  | "ring"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "sidebar"
  | "sidebar-foreground"
  | "sidebar-primary"
  | "sidebar-primary-foreground"
  | "sidebar-accent"
  | "sidebar-accent-foreground"
  | "sidebar-border"
  | "sidebar-ring";

type ColorGroup = {
  id: string;
  title: string;
  tokens: Array<{
    key: ColorTokenKey;
    label: string;
  }>;
};

const COLOR_GROUPS: ColorGroup[] = [
  {
    id: "base",
    title: "Base",
    tokens: [
      { key: "background", label: "Background" },
      { key: "foreground", label: "Foreground" },
    ],
  },
  {
    id: "primary",
    title: "Primary",
    tokens: [
      { key: "primary", label: "Primary" },
      { key: "primary-foreground", label: "Primary Foreground" },
    ],
  },
  {
    id: "secondary",
    title: "Secondary",
    tokens: [
      { key: "secondary", label: "Secondary" },
      { key: "secondary-foreground", label: "Secondary Foreground" },
    ],
  },
  {
    id: "accent",
    title: "Accent",
    tokens: [
      { key: "accent", label: "Accent" },
      { key: "accent-foreground", label: "Accent Foreground" },
    ],
  },
  {
    id: "muted",
    title: "Muted",
    tokens: [
      { key: "muted", label: "Muted" },
      { key: "muted-foreground", label: "Muted Foreground" },
    ],
  },
  {
    id: "card",
    title: "Card",
    tokens: [
      { key: "card", label: "Card" },
      { key: "card-foreground", label: "Card Foreground" },
    ],
  },
  {
    id: "popover",
    title: "Popover",
    tokens: [
      { key: "popover", label: "Popover" },
      { key: "popover-foreground", label: "Popover Foreground" },
    ],
  },
  {
    id: "destructive",
    title: "Destructive",
    tokens: [
      { key: "destructive", label: "Destructive" },
      { key: "destructive-foreground", label: "Destructive Foreground" },
    ],
  },
  {
    id: "border",
    title: "Border & Input",
    tokens: [
      { key: "border", label: "Border" },
      { key: "input", label: "Input" },
      { key: "ring", label: "Ring" },
    ],
  },
  {
    id: "chart",
    title: "Chart",
    tokens: [
      { key: "chart-1", label: "Chart 1" },
      { key: "chart-2", label: "Chart 2" },
      { key: "chart-3", label: "Chart 3" },
      { key: "chart-4", label: "Chart 4" },
      { key: "chart-5", label: "Chart 5" },
    ],
  },
  {
    id: "sidebar",
    title: "Sidebar",
    tokens: [
      { key: "sidebar", label: "Sidebar" },
      { key: "sidebar-foreground", label: "Sidebar Foreground" },
      { key: "sidebar-primary", label: "Sidebar Primary" },
      {
        key: "sidebar-primary-foreground",
        label: "Sidebar Primary Foreground",
      },
      { key: "sidebar-accent", label: "Sidebar Accent" },
      { key: "sidebar-accent-foreground", label: "Sidebar Accent Foreground" },
      { key: "sidebar-border", label: "Sidebar Border" },
      { key: "sidebar-ring", label: "Sidebar Ring" },
    ],
  },
];

let colorProbe: HTMLDivElement | null = null;
const colorCache = new Map<string, string | null>();

function getColorProbe() {
  if (typeof document === "undefined") {
    return null;
  }

  if (!colorProbe) {
    colorProbe = document.createElement("div");
    colorProbe.setAttribute("aria-hidden", "true");
    colorProbe.style.position = "fixed";
    colorProbe.style.inset = "0";
    colorProbe.style.opacity = "0";
    colorProbe.style.pointerEvents = "none";
    document.body.appendChild(colorProbe);
  }

  return colorProbe;
}

function rgbToHex(value: string) {
  const match = value.match(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i);

  if (!match) {
    return null;
  }

  return `#${match
    .slice(1, 4)
    .map((channel) => Number(channel).toString(16).padStart(2, "0").toLowerCase())
    .join("")}`;
}

function getColorInputValue(value: string) {
  if (!value) {
    return null;
  }

  const cached = colorCache.get(value);
  if (cached !== undefined) {
    return cached;
  }

  if (/^#[\da-f]{6}$/i.test(value)) {
    const normalized = value.toLowerCase();
    colorCache.set(value, normalized);
    return normalized;
  }

  if (/^#[\da-f]{3}$/i.test(value)) {
    const [, r, g, b] = value;
    const normalized = `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    colorCache.set(value, normalized);
    return normalized;
  }

  const probe = getColorProbe();
  if (!probe) {
    return null;
  }

  probe.style.color = "";
  probe.style.color = value;

  if (!probe.style.color) {
    colorCache.set(value, null);
    return null;
  }

  const normalized = rgbToHex(getComputedStyle(probe).color);
  colorCache.set(value, normalized);

  return normalized;
}

function isValidCssColor(value: string) {
  return getColorInputValue(value) !== null;
}

function ColorRow({
  label,
  value,
  isOverridden,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  isOverridden: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const [inputValue, setInputValue] = React.useState(value);
  const [isMounted, setIsMounted] = React.useState(false);
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const nativeColorValue = React.useMemo(() => {
    if (!isMounted) {
      return null;
    }

    return getColorInputValue(value);
  }, [isMounted, value]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors",
        isOverridden && "bg-muted/40",
      )}
    >
      <button
        type="button"
        className="size-5 shrink-0 rounded-md border border-foreground/10 shadow-xs"
        style={{ backgroundColor: value }}
        onClick={() => colorInputRef.current?.click()}
        aria-label={`Pick color for ${label}`}
      />
      <input
        ref={colorInputRef}
        type="color"
        className="sr-only"
        value={nativeColorValue ?? "#000000"}
        onChange={(event) => onChange(event.target.value)}
        tabIndex={-1}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{label}</div>
      </div>
      <Input
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onBlur={() => {
          const trimmed = inputValue.trim();

          if (!trimmed) {
            onReset();
            return;
          }

          if (!isValidCssColor(trimmed)) {
            setInputValue(value);
            return;
          }

          onChange(trimmed);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="h-7 w-34 font-mono text-xs"
        spellCheck={false}
      />
      {isOverridden ? (
        <Button variant="ghost" size="xs" onClick={onReset}>
          Reset
        </Button>
      ) : null}
    </div>
  );
}

function ColorGroupSection({
  group,
  styles,
  overrides,
  onTokenChange,
  onTokenReset,
  defaultOpen = false,
}: {
  group: ColorGroup;
  styles: Record<string, string>;
  overrides: Record<string, string>;
  onTokenChange: (key: ColorTokenKey, value: string) => void;
  onTokenReset: (key: ColorTokenKey) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-1.5 py-1.5 text-left text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <span>{group.title}</span>
          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 pb-2">
          {group.tokens.map((token) => (
            <ColorRow
              key={token.key}
              label={token.label}
              value={styles[token.key] ?? ""}
              isOverridden={token.key in overrides}
              onChange={(value) => onTokenChange(token.key, value)}
              onReset={() => onTokenReset(token.key)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AdvancedColorEditor({ params }: { params: DesignSystemSearchParams }) {
  const [, setParams] = useDesignSystemSearchParams();
  const [search, setSearch] = React.useState("");
  const [mode, setMode] = React.useState<ThemeVarMode>("light");

  const effectiveRadius = params.style === "lyra" ? "none" : params.radius;
  const registryTheme = React.useMemo(() => {
    return buildRegistryTheme({
      ...params,
      radius: effectiveRadius,
    });
  }, [effectiveRadius, params]);
  const customThemeVars = React.useMemo(() => decodeCustomThemeVars(params.vars), [params.vars]);

  const baseModeVars = React.useMemo(
    () => ({
      light: (registryTheme.cssVars?.light ?? {}) as Record<string, string>,
      dark: (registryTheme.cssVars?.dark ?? {}) as Record<string, string>,
    }),
    [registryTheme.cssVars],
  );

  const activeStyles = React.useMemo(
    () => ({
      ...(baseModeVars[mode] ?? {}),
      ...(customThemeVars[mode] ?? {}),
    }),
    [baseModeVars, customThemeVars, mode],
  );

  const activeOverrides = customThemeVars[mode] ?? {};
  const hasAnyOverrides = Boolean(customThemeVars.light || customThemeVars.dark);

  const setCustomVars = React.useCallback(
    (nextValue: ReturnType<typeof decodeCustomThemeVars>) => {
      const encoded = encodeCustomThemeVars(nextValue);
      setParams({
        custom: Boolean(encoded),
        vars: encoded,
      });
    },
    [setParams],
  );

  const handleTokenChange = React.useCallback(
    (key: ColorTokenKey, value: string) => {
      const trimmed = value.trim();
      const nextModeVars = {
        ...(customThemeVars[mode] ?? {}),
      };

      if (!trimmed || trimmed === baseModeVars[mode][key]) {
        delete nextModeVars[key];
      } else {
        nextModeVars[key] = trimmed;
      }

      setCustomVars({
        ...customThemeVars,
        [mode]: nextModeVars,
      });
    },
    [baseModeVars, customThemeVars, mode, setCustomVars],
  );

  const handleTokenReset = React.useCallback(
    (key: ColorTokenKey) => {
      const nextModeVars = {
        ...(customThemeVars[mode] ?? {}),
      };

      delete nextModeVars[key];

      setCustomVars({
        ...customThemeVars,
        [mode]: nextModeVars,
      });
    },
    [customThemeVars, mode, setCustomVars],
  );

  const handleModeReset = React.useCallback(() => {
    setCustomVars({
      ...customThemeVars,
      [mode]: {},
    });
  }, [customThemeVars, mode, setCustomVars]);

  const filteredGroups = React.useMemo(() => {
    if (!search.trim()) {
      return COLOR_GROUPS;
    }

    const query = search.trim().toLowerCase();

    return COLOR_GROUPS.map((group) => ({
      ...group,
      tokens: group.tokens.filter((token) => {
        return (
          token.label.toLowerCase().includes(query) ||
          token.key.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query)
        );
      }),
    })).filter((group) => group.tokens.length > 0);
  }, [search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as ThemeVarMode)}
          className="gap-0"
        >
          <TabsList className="h-8">
            <TabsTrigger value="light" className="text-xs">
              Light
            </TabsTrigger>
            <TabsTrigger value="dark" className="text-xs">
              Dark
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          {activeOverrides && Object.keys(activeOverrides).length > 0 ? (
            <Button variant="ghost" size="xs" onClick={handleModeReset}>
              Reset {mode}
            </Button>
          ) : null}
          {hasAnyOverrides ? (
            <Button variant="ghost" size="xs" onClick={() => setCustomVars({})}>
              Reset all
            </Button>
          ) : null}
        </div>
      </div>
      <div className="px-1 pb-2">
        <Input
          type="search"
          placeholder="Search variables..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {filteredGroups.map((group, index) => (
            <ColorGroupSection
              key={group.id}
              group={group}
              styles={activeStyles}
              overrides={activeOverrides}
              onTokenChange={handleTokenChange}
              onTokenReset={handleTokenReset}
              defaultOpen={index < 2}
            />
          ))}
        </div>
      </div>
      <p className="px-1 pt-3 text-[11px] text-muted-foreground">
        Advanced variable edits apply to the current configuration and reset when you switch
        presets, themes, or styles.
      </p>
    </div>
  );
}
