"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2, PackageOpen, Search } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { PresetColorSwatch } from "@/app/(main)/community/components/preset-color-swatch";

import { PresetCard } from "./preset-card";

function PresetGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 gap-y-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <PackageOpen className="size-8" />
      <p className="text-sm">{message}</p>
      {sub && <p className="text-xs">{sub}</p>}
    </div>
  );
}

interface LikedPreset {
  id: string;
  title: string;
  presetCode: string;
  base: string;
}

function LikedPresetCard({ preset }: { preset: LikedPreset }) {
  const router = useRouter();

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => router.push(`/create?preset=${preset.presetCode}&base=${preset.base}`)}
    >
      <div className="relative h-40 overflow-hidden rounded-xl border border-border/50 transition-all group-hover:shadow-md group-hover:border-border">
        <PresetColorSwatch presetCode={preset.presetCode} className="h-full" />
        <div className="absolute right-2 top-2">
          <Heart className="size-4 fill-red-500 text-red-500" />
        </div>
      </div>
      <div className="px-1 pt-2">
        <span className="text-sm font-medium truncate block">{preset.title}</span>
        <span className="text-xs text-muted-foreground capitalize">{preset.base}</span>
      </div>
    </div>
  );
}

export function PresetsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const trpc = useTRPC();
  const [search, setSearch] = React.useState("");

  const { data: presets, isLoading: presetsLoading } = useQuery(
    trpc.presets.list.queryOptions(undefined, {
      enabled: !!session?.user,
    }),
  );

  const { data: likedPresets, isLoading: likedLoading } = useQuery(
    trpc.community.likedPresets.queryOptions(undefined, {
      enabled: !!session?.user,
    }),
  );

  const query = search.toLowerCase().trim();

  const filteredPresets = React.useMemo(() => {
    if (!presets) return [];
    if (!query) return presets;
    return presets.filter((p) => p.name.toLowerCase().includes(query));
  }, [presets, query]);

  const filteredLiked = React.useMemo(() => {
    if (!likedPresets) return [];
    if (!query) return likedPresets;
    return likedPresets.filter((p) => p.title.toLowerCase().includes(query));
  }, [likedPresets, query]);

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

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search presets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="my">
          <TabsList>
            <TabsTrigger value="my">My{presets ? ` (${filteredPresets.length})` : ""}</TabsTrigger>
            <TabsTrigger value="liked">
              <Heart className="size-3.5 mr-1.5" />
              Liked{likedPresets ? ` (${filteredLiked.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-4">
            {presetsLoading ? (
              <PresetGridSkeleton />
            ) : filteredPresets.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 gap-y-8">
                {filteredPresets.map((preset) => (
                  <PresetCard key={preset.id} preset={preset} />
                ))}
              </div>
            ) : query ? (
              <EmptyState message={`No presets matching "${search}"`} />
            ) : (
              <EmptyState
                message="No presets saved yet"
                sub={
                  <>
                    Use <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">⌘S</kbd> in
                    the editor to save your first preset.
                  </>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-4">
            {likedLoading ? (
              <PresetGridSkeleton />
            ) : filteredLiked.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 gap-y-8">
                {filteredLiked.map((preset) => (
                  <LikedPresetCard key={preset.id} preset={preset} />
                ))}
              </div>
            ) : query ? (
              <EmptyState message={`No liked presets matching "${search}"`} />
            ) : (
              <EmptyState
                message="No liked presets yet"
                sub={
                  <>
                    Browse the{" "}
                    <Link href="/community" className="underline text-foreground">
                      community
                    </Link>{" "}
                    and like presets to save them here.
                  </>
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
