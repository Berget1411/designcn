"use client";

import * as React from "react";
import { Menu09Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerItem,
  PickerSeparator,
  PickerShortcut,
  PickerTrigger,
} from "@/app/create/components/picker";
import { useCommand } from "@/form-builder/hooks/use-command-ctx";

export function FormBuilderMenu({ className }: { className?: string }) {
  const { setOpenCommand } = useCommand();

  return (
    <Picker>
      <PickerTrigger
        className={[
          "flex items-center justify-between gap-2 rounded-lg px-1.75 ring-1 ring-foreground/10 focus-visible:ring-1",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="font-medium">Menu</span>
        <HugeiconsIcon icon={Menu09Icon} strokeWidth={2} className="size-5" />
      </PickerTrigger>
      <PickerContent side="right" align="start" alignOffset={-8}>
        <PickerGroup>
          <PickerItem onClick={() => setOpenCommand(true)}>
            Add field...
            <PickerShortcut>Alt+F</PickerShortcut>
          </PickerItem>
        </PickerGroup>
        <PickerSeparator />
        <PickerGroup>
          <PickerItem onClick={() => window.history.back()}>Back</PickerItem>
        </PickerGroup>
      </PickerContent>
    </Picker>
  );
}
