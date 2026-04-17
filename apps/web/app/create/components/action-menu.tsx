"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { Heart, Save } from "lucide-react";
import { type RegistryItem } from "shadcn/schema";
import { useQuery } from "@tanstack/react-query";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command";
import { useActionMenu } from "@/app/create/hooks/use-action-menu";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

export const CMD_K_FORWARD_TYPE = "cmd-k-forward";

export function ActionMenu({
  itemsByBase,
}: {
  itemsByBase: Record<string, Pick<RegistryItem, "name" | "title" | "type">[]>;
}) {
  const router = useRouter();
  const { activeRegistryName, getCommandValue, groups, handleSelect, open, setOpen } =
    useActionMenu(itemsByBase);
  const { data: session } = useSession();
  const trpc = useTRPC();

  const { data: myPresets } = useQuery(
    trpc.presets.list.queryOptions(undefined, {
      enabled: !!session?.user && open,
      staleTime: 2 * 60 * 1000,
    }),
  );

  const { data: likedPresets } = useQuery(
    trpc.community.likedPresets.queryOptions(undefined, {
      enabled: !!session?.user && open,
      staleTime: 2 * 60 * 1000,
    }),
  );

  const handlePresetSelect = (presetCode: string, base: string) => {
    router.push(`/create?preset=${presetCode}&base=${base}`);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="animate-none!">
      <Command loop>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup>
            {groups.map((group) =>
              group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={getCommandValue(item)}
                  data-checked={activeRegistryName === item.registryName}
                  className="px-2"
                  onSelect={() => {
                    handleSelect(item.registryName);
                  }}
                >
                  {item.label}
                </CommandItem>
              )),
            )}
          </CommandGroup>
          {myPresets && myPresets.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="My Presets">
                {myPresets.map((preset) => (
                  <CommandItem
                    key={preset.id}
                    value={`${preset.name} my preset saved`}
                    className="px-2 gap-2"
                    onSelect={() => handlePresetSelect(preset.presetCode, preset.base)}
                  >
                    <Save className="size-3.5 text-muted-foreground shrink-0" />
                    {preset.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {likedPresets && likedPresets.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Liked Presets">
                {likedPresets.map((preset) => (
                  <CommandItem
                    key={preset.id}
                    value={`${preset.title} liked preset community`}
                    className="px-2 gap-2"
                    onSelect={() => handlePresetSelect(preset.presetCode, preset.base)}
                  >
                    <Heart className="size-3.5 fill-red-500 text-red-500 shrink-0" />
                    {preset.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export function ActionMenuScript() {
  return (
    <Script
      id="design-system-listener"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
            (function() {
              // Forward Cmd/Ctrl + K (and P) to parent
              document.addEventListener('keydown', function(e) {
                if ((e.key === 'k' || e.key === 'p') && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                      type: '${CMD_K_FORWARD_TYPE}',
                      key: e.key
                    }, '*');
                  }
                }
              });

            })();
          `,
      }}
    />
  );
}
