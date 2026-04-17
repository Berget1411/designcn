"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type InfiniteListData = {
  pages: {
    items: {
      id: string;
      isLikedByMe: boolean;
      likeCount: number;
    }[];
    nextCursor: string | null;
  }[];
  pageParams: unknown[];
};

function toggleLikeInData(data: unknown, communityPresetId: string): unknown {
  if (!data || typeof data !== "object" || !("pages" in data)) return data;
  const d = data as InfiniteListData;
  return {
    ...d,
    pages: d.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.id === communityPresetId
          ? {
              ...item,
              isLikedByMe: !item.isLikedByMe,
              likeCount: item.isLikedByMe ? Math.max(0, item.likeCount - 1) : item.likeCount + 1,
            }
          : item,
      ),
    })),
  };
}

export function useLike() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get filter that matches all community.list queries (regular + infinite)
  const listFilter = trpc.community.list.pathFilter();

  return useMutation(
    trpc.community.like.mutationOptions({
      onMutate: async ({ communityPresetId }) => {
        await queryClient.cancelQueries(listFilter);

        const previousData = queryClient.getQueriesData(listFilter);

        // Optimistically toggle like in all cached list queries
        queryClient.setQueriesData(listFilter, (old: unknown) =>
          toggleLikeInData(old, communityPresetId),
        );

        return { previousData };
      },
      onError: (_err, _vars, context) => {
        if (context?.previousData) {
          for (const [key, data] of context.previousData) {
            queryClient.setQueryData(key, data);
          }
        }
      },
      onSettled: () => {
        void queryClient.invalidateQueries(listFilter);
        void queryClient.invalidateQueries(trpc.community.getById.pathFilter());
      },
    }),
  );
}
