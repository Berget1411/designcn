"use client";

import { Menu09Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";

import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerItem,
  PickerSeparator,
  PickerTrigger,
} from "@/app/create/components/picker";
import { templates } from "@/form-builder/constant/templates";
import { useFormIdFromRoute } from "@/form-builder/hooks/use-form-id-from-route";

export function LocalFormsMenu({ className }: { className?: string }) {
  const { navigateToForm } = useFormIdFromRoute();
  const router = useRouter();
  const defaultTemplateId = templates[0]?.id;

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
          {templates.map(({ id, title }) => (
            <PickerItem key={id} onClick={() => navigateToForm(id)}>
              {title}
            </PickerItem>
          ))}
        </PickerGroup>
        <PickerSeparator />
        <PickerGroup>
          <PickerItem onClick={() => router.push("/ai?mode=form")}>AI Form Generator</PickerItem>
        </PickerGroup>
      </PickerContent>
    </Picker>
  );
}
