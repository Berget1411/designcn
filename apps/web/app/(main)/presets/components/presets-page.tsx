"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PackageOpen } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

import { PresetCard } from "./preset-card";

export function PresetsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const trpc = useTRPC();

  const { data: presets, isLoading } = useQuery(
    trpc.presets.list.queryOptions(undefined, {
      enabled: !!session?.user,
    }),
  );

  if (sessionPending) {
    return (
      <div className="flex min-h-svh pt-14 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-svh pt-14 flex-col items-center justify-center gap-4">
        <PackageOpen className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">Sign in to view your presets</p>
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-svh pt-14 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">My Presets</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/community">Browse Community</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 gap-y-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : presets && presets.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 gap-y-8">
            {presets.map((preset) => (
              <PresetCard key={preset.id} preset={preset} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <PackageOpen className="size-8" />
            <p className="text-sm">No presets saved yet</p>
            <p className="text-xs">
              Use <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">⌘S</kbd> in the
              editor to save your first preset.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
