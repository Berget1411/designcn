"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useLike() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.community.like.mutationOptions({
      onMutate: async ({ communityPresetId }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.community.list.queryKey(),
        });

        // Snapshot previous data for all list queries
        const previousData = queryClient.getQueriesData({
          queryKey: trpc.community.list.queryKey(),
        });

        // Optimistically toggle like in all cached list queries
        queryClient.setQueriesData({ queryKey: trpc.community.list.queryKey() }, (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const data = old as {
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
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === communityPresetId
                  ? {
                      ...item,
                      isLikedByMe: !item.isLikedByMe,
                      likeCount: item.isLikedByMe
                        ? Math.max(0, item.likeCount - 1)
                        : item.likeCount + 1,
                    }
                  : item,
              ),
            })),
          };
        });

        return { previousData };
      },
      onError: (_err, _vars, context) => {
        // Rollback on error
        if (context?.previousData) {
          for (const [key, data] of context.previousData) {
            queryClient.setQueryData(key, data);
          }
        }
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.community.list.queryKey(),
        });
      },
    }),
  );
}
