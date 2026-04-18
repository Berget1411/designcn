"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { formElementsList } from "@/form-builder/constant/form-elements-list";
import { type FormElement } from "@/form-builder/form-types";
import useFormBuilderStore from "@/form-builder/hooks/use-form-builder-store";

const renderElementButton = (o: (typeof formElementsList)[0]) => {
  const appendElement = useFormBuilderStore((s) => s.appendElement);
  const formElements = useFormBuilderStore((s) => s.formElements);
  const isMS = useFormBuilderStore((s) => s.isMS);
  const Icon = o.icon;
  return (
    <Button
      key={o.name}
      variant="ghost"
      onClick={() => {
        appendElement({
          fieldType: o.fieldType as FormElement["fieldType"],
          stepIndex: isMS ? formElements.length - 1 : undefined,
        });
      }}
      className="h-auto w-full justify-start rounded-2xl border border-transparent px-2.5 py-2.5 transition hover:border-border/60 hover:bg-background/80"
    >
      <div className="flex items-center justify-start gap-2 text-accent-foreground">
        <span className="grid size-8 place-items-center rounded-2xl border border-dashed bg-accent/40">
          <Icon className="size-3.5 text-muted-foreground" />
        </span>
        <div className="flex flex-col items-start justify-start">
          <div className="text-sm font-medium">
            {o.name}
            {o?.isNew! && (
              <Badge className="ml-1 rounded-2xl text-[9px] font-medium" variant="destructive">
                New
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Button>
  );
};

type GroupedElements = Record<string, typeof formElementsList>;

const SidebarContent = ({ groupedElements }: { groupedElements: GroupedElements }) => (
  <div className="space-y-4 py-1">
    {groupedElements.display && (
      <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-3">
        <h3 className="mb-2 px-1 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Display Elements
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1">
          {groupedElements.display.map(renderElementButton)}
        </div>
      </div>
    )}
    {groupedElements.field && (
      <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-3">
        <h3 className="mb-2 px-1 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Field Elements
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1">
          {groupedElements.field.map(renderElementButton)}
        </div>
      </div>
    )}
  </div>
);

// Group elements by their group property
const groupedElements = formElementsList.reduce((acc, element) => {
  const group = element.group || "other";
  if (!acc[group]) {
    acc[group] = [];
  }
  acc[group].push(element);
  return acc;
}, {} as GroupedElements);
//======================================
export const FormElementsSidebar = () => {
  return (
    <div className="relative h-full max-h-full w-full">
      <div className="hidden lg:block">
        <SidebarContent groupedElements={groupedElements} />
      </div>
      <div className="lg:hidden">
        <Drawer direction="bottom">
          <DrawerTrigger asChild>
            <Button variant="outline" className="mb-1 h-11 w-full rounded-2xl bg-background/70">
              Form elements
            </Button>
          </DrawerTrigger>
          <DrawerContent className="bg-card/95 backdrop-blur-xl data-[vaul-drawer-direction=left]:sm:max-w-sm">
            <DrawerHeader className="px-4 pb-1">
              <DrawerTitle className="text-sm">Form elements</DrawerTitle>
            </DrawerHeader>
            <div className="h-full overflow-y-auto px-3 pb-4">
              <SidebarContent groupedElements={groupedElements} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};
