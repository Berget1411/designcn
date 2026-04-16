"use client";

import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";

const FREE_FEATURES = [
  "Customize colors & typography",
  "Real-time preview",
  "Export CSS variables",
  "Community presets",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited saved presets",
  "Priority support",
  "Early access to new features",
];

export default function PricingPage() {
  const { data: session } = useSession();
  const { plan, isPending } = useSubscription();
  const router = useRouter();

  function handleUpgrade() {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    authClient.checkout({ slug: "pro" });
  }

  return (
    <div className="flex min-h-svh flex-col items-center pt-14 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl py-16 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-3 text-muted-foreground">Start for free, upgrade when you need more.</p>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2">
        {/* Free Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>For getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-3xl font-semibold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="size-4 shrink-0 text-muted-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isPending ? (
              <Skeleton className="h-9 w-full rounded-full" />
            ) : session && plan === "free" ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <a href="/create">Get Started</a>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Pro Tier */}
        <Card className="ring-2 ring-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Pro</CardTitle>
              <Badge variant="default">Popular</Badge>
            </div>
            <CardDescription>For power users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-3xl font-semibold">$8</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="size-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isPending ? (
              <Skeleton className="h-9 w-full rounded-full" />
            ) : plan === "pro" ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button className="w-full" onClick={handleUpgrade}>
                Upgrade to Pro
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
