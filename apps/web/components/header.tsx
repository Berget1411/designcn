"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut, authClient, useSubscription } from "@/lib/auth-client";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu";
import { cn } from "@workspace/ui/lib/utils";
import { IoIosColorPalette } from "react-icons/io";
import { ENABLE_AI, ENABLE_SUBSCRIPTIONS } from "@/lib/features";

const createItems = [
  {
    title: "Create Preset",
    href: "/create",
    description: "Create a new preset and share it with the community.",
  },
  {
    title: "Create Form",
    href: "/form-creator",
    description: "Start a new form and keep room for future create actions here.",
  },
];

export function Header({ stars }: { stars?: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const { plan, isPending: subscriptionPending } = useSubscription();
  const isHomePage = pathname === "/";

  function getInitials(name?: string | null, email?: string | null) {
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
        : (parts[0] ?? "").slice(0, 2).toUpperCase();
    }
    return email?.[0]?.toUpperCase() ?? "?";
  }

  const headerNavigation = (
    <div className={cn("flex items-center gap-4", isHomePage && "relative z-[60]")}>
      <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
        <IoIosColorPalette className="size-4" />
        Designcn
      </Link>
      <nav className="hidden items-center sm:flex">
        <NavigationMenu viewport={false} className={isHomePage ? "z-[60]" : undefined}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/community">Community</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/presets">My Presets</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            {ENABLE_AI && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/ai">AI</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Create</NavigationMenuTrigger>
              <NavigationMenuContent
                className={isHomePage ? "absolute z-[80] overflow-visible" : undefined}
              >
                <ul className="grid w-[320px] gap-1">
                  {createItems.map((item) => (
                    <HeaderNavItem key={item.title} href={item.href} title={item.title}>
                      {item.description}
                    </HeaderNavItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-3">
      {stars}
      <ThemeSwitcher />
      {ENABLE_SUBSCRIPTIONS && !isPending && session && subscriptionPending && (
        <Skeleton className="h-7 w-16 rounded-full" />
      )}
      {ENABLE_SUBSCRIPTIONS && !isPending && session && !subscriptionPending && plan === "free" && (
        <Button size="sm" variant="outline" asChild>
          <Link href="/pricing">Upgrade</Link>
        </Button>
      )}
      {ENABLE_SUBSCRIPTIONS && !isPending && session && !subscriptionPending && plan === "pro" && (
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
                <span className="text-xs text-muted-foreground truncate">{session.user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ENABLE_SUBSCRIPTIONS && plan === "pro" && (
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
  );

  return (
    <header
      className={cn(
        "top-0 z-50",
        isHomePage
          ? "sticky isolate max-w-screen overflow-x-clip overflow-y-visible bg-background px-2 pt-2"
          : "fixed inset-x-0 border-b border-border bg-background/80 backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "container mx-auto flex h-14 items-center justify-between px-4 sm:px-6",
          isHomePage &&
            "screen-line-top screen-line-bottom relative z-[55] gap-3 overflow-visible border-x border-line bg-background",
        )}
      >
        {headerNavigation}
        {headerActions}
        {isHomePage && (
          <>
            <div className="absolute top-[-3.5px] left-[-4.5px] z-2 flex size-2 border border-line bg-background" />
            <div className="absolute top-[-3.5px] right-[-4.5px] z-2 flex size-2 border border-line bg-background" />
          </>
        )}
      </div>
    </header>
  );
}

function HeaderNavItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  title: string;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="flex flex-col gap-1 text-sm">
            <div className="leading-none font-medium">{title}</div>
            <div className="line-clamp-2 text-muted-foreground">{children}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
