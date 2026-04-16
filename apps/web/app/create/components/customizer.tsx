"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Settings2, SlidersHorizontal } from "lucide-react";
import { type RegistryItem } from "shadcn/schema";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { getThemesForBaseColor, STYLES } from "@/registry/config";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader } from "@workspace/ui/components/card";
import { FieldGroup, FieldSeparator } from "@workspace/ui/components/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { MenuAccentPicker } from "@/app/create/components/accent-picker";
import { ActionMenu } from "@/app/create/components/action-menu";
import { AdvancedColorEditor } from "@/app/create/components/advanced-color-editor";
import { BaseColorPicker } from "@/app/create/components/base-color-picker";
import { BasePicker } from "@/app/create/components/base-picker";
import { ChartColorPicker } from "@/app/create/components/chart-color-picker";
import { CopyPreset } from "@/app/create/components/copy-preset";
import { FontPicker } from "@/app/create/components/font-picker";
import { IconLibraryPicker } from "@/app/create/components/icon-library-picker";
import { MainMenu } from "@/app/create/components/main-menu";
import { MenuColorPicker } from "@/app/create/components/menu-picker";
import { OpenPreset } from "@/app/create/components/open-preset";
import { RadiusPicker } from "@/app/create/components/radius-picker";
import { RandomButton } from "@/app/create/components/random-button";
import { ResetDialog } from "@/app/create/components/reset-button";
import { StylePicker } from "@/app/create/components/style-picker";
import { ThemePicker } from "@/app/create/components/theme-picker";
import { FONT_HEADING_OPTIONS, FONTS } from "@/app/create/lib/fonts";
import { useDesignSystemSearchParams } from "@/app/create/lib/search-params";

// Only visible when user clicks "Create Project".
const ProjectForm = dynamic(() =>
  import("@/app/create/components/project-form").then((m) => m.ProjectForm),
);

function AdvancedToggleButton({ advanced, onClick }: { advanced: boolean; onClick: () => void }) {
  const label = advanced ? "Show config controls" : "Show advanced colors";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn("shrink-0", advanced && "bg-muted")}
          onClick={onClick}
          aria-label={label}
        >
          {advanced ? (
            <Settings2 className="size-3.5" />
          ) : (
            <SlidersHorizontal className="size-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Customizer({
  itemsByBase,
}: {
  itemsByBase: Record<string, Pick<RegistryItem, "name" | "title" | "type">[]>;
}) {
  const [params] = useDesignSystemSearchParams();
  const isMobile = useIsMobile();
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const [advanced, setAdvanced] = React.useState(false);

  const availableThemes = React.useMemo(
    () => getThemesForBaseColor(params.baseColor),
    [params.baseColor],
  );

  return (
    <Card
      className="dark top-24 right-12 isolate z-10 max-h-full min-h-0 w-full self-start rounded-2xl bg-card/90 shadow-xl backdrop-blur-xl md:w-(--customizer-width)"
      ref={anchorRef}
      size="sm"
    >
      <CardHeader className="hidden items-center justify-between gap-2 border-b group-data-reversed/layout:flex-row-reverse md:flex">
        <div className="min-w-0 flex-1">
          <MainMenu className="w-full" />
        </div>
        <AdvancedToggleButton advanced={advanced} onClick={() => setAdvanced((value) => !value)} />
      </CardHeader>
      <CardContent
        className={cn(
          "no-scrollbar min-h-0 flex-1",
          advanced
            ? "flex flex-col overflow-hidden"
            : "overflow-x-auto overflow-y-hidden md:overflow-y-auto",
        )}
      >
        <div className="flex items-center justify-end px-px pb-3 md:hidden">
          <AdvancedToggleButton
            advanced={advanced}
            onClick={() => setAdvanced((value) => !value)}
          />
        </div>
        {advanced ? (
          <AdvancedColorEditor params={params} />
        ) : (
          <FieldGroup className="flex-row gap-2.5 py-px **:data-[slot=field-separator]:-mx-4 **:data-[slot=field-separator]:w-auto md:flex-col md:gap-3.25">
            <StylePicker styles={STYLES} isMobile={isMobile} anchorRef={anchorRef} />
            <FieldSeparator className="hidden md:block" />
            <BaseColorPicker isMobile={isMobile} anchorRef={anchorRef} />
            <ThemePicker
              themes={availableThemes}
              isMobile={isMobile}
              anchorRef={anchorRef}
              onAdvanced={() => setAdvanced(true)}
            />
            <ChartColorPicker isMobile={isMobile} anchorRef={anchorRef} />
            <FieldSeparator className="hidden md:block" />
            <FontPicker
              label="Heading"
              param="fontHeading"
              fonts={FONT_HEADING_OPTIONS}
              isMobile={isMobile}
              anchorRef={anchorRef}
            />
            <FontPicker
              label="Font"
              param="font"
              fonts={FONTS}
              isMobile={isMobile}
              anchorRef={anchorRef}
            />
            <FieldSeparator className="hidden md:block" />
            <IconLibraryPicker isMobile={isMobile} anchorRef={anchorRef} />
            <RadiusPicker isMobile={isMobile} anchorRef={anchorRef} />
            <FieldSeparator className="hidden md:block" />
            <MenuColorPicker isMobile={isMobile} anchorRef={anchorRef} />
            <MenuAccentPicker isMobile={isMobile} anchorRef={anchorRef} />
            {isMobile && <BasePicker isMobile={isMobile} anchorRef={anchorRef} />}
          </FieldGroup>
        )}
      </CardContent>
      {!advanced ? (
        <React.Fragment>
          <CardFooter className="flex min-w-0 gap-2 md:flex-col md:rounded-b-none md:**:[button,a]:w-full">
            <CopyPreset className="min-w-0 flex-1 md:flex-none" />
            <OpenPreset
              className="max-w-20 min-w-0 flex-1 sm:max-w-none md:flex-none"
              label={isMobile ? "Open" : "Open Config"}
            />
            <RandomButton className="max-w-20 min-w-0 flex-1 sm:max-w-none md:flex-none" />
            <ActionMenu itemsByBase={itemsByBase} />
            <ResetDialog />
          </CardFooter>
          <CardFooter className="-mt-3 hidden min-w-0 gap-2 md:flex md:flex-col md:**:[button,a]:w-full">
            <ProjectForm />
          </CardFooter>
        </React.Fragment>
      ) : null}
    </Card>
  );
}
