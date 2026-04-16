"use client";

import Link from "next/link";
import { useSession, signOut, authClient } from "@/lib/auth-client";
import { useSubscription } from "@/hooks/use-subscription";
import { ThemeSwitcher } from "@/components/theme-switcher/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

export function Header({ stars }: { stars?: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const { plan, isPending: subscriptionPending } = useSubscription();

  function getInitials(name?: string | null, email?: string | null) {
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
        : (parts[0] ?? "").slice(0, 2).toUpperCase();
    }
    return email?.[0]?.toUpperCase() ?? "?";
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Designcn
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/community"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
            >
              Community
            </Link>
            <Link
              href="/presets"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
            >
              My Presets
            </Link>
            <Link
              href="/ai"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
            >
              AI
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {stars}
          <ThemeSwitcher />
          {!isPending && session && subscriptionPending && (
            <Skeleton className="h-7 w-16 rounded-full" />
          )}
          {!isPending && session && !subscriptionPending && plan === "free" && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/pricing">Upgrade</Link>
            </Button>
          )}
          {!isPending && session && !subscriptionPending && plan === "pro" && (
            <Badge variant="secondary">Pro</Badge>
          )}
          {isPending ? (
            <Skeleton className="size-7 rounded-full" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar size="sm">
                    <AvatarImage
                      src={session.user.image ?? undefined}
                      alt={session.user.name ?? "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(session.user.name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    {session.user.name && (
                      <span className="text-sm font-medium">{session.user.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {plan === "pro" && (
                  <DropdownMenuItem onSelect={() => authClient.customer.portal()}>
                    Manage Subscription
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() =>
                    signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/";
                        },
                      },
                    })
                  }
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
