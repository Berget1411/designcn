import Link from "next/link";
import { Button } from "@workspace/ui/components/button";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Welcome to Pro!</h1>
      <p className="mt-3 text-muted-foreground">
        Your subscription is now active. Enjoy all Pro features.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/create">Start Creating</Link>
      </Button>
    </div>
  );
}
