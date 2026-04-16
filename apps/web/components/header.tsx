"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { ThemeSwitcher } from "@/components/theme-switcher/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

export function Header({ stars }: { stars?: React.ReactNode }) {
  const { data: session } = useSession();

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
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Designcn
        </Link>

        <div className="flex items-center gap-3">
          {stars}
          <ThemeSwitcher />
          {session ? (
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
