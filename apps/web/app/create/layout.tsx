import { Suspense } from "react";

import { HistoryProvider } from "@/app/create/hooks/use-history";
import { LocksProvider } from "@/app/create/hooks/use-locks";
import { Header } from "@/components/header";
import { GitHubStarsCount } from "@/components/github-stars/github-stars-count";

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocksProvider>
      <Suspense>
        <HistoryProvider>
          <Header
            stars={
              <Suspense fallback={null}>
                <GitHubStarsCount />
              </Suspense>
            }
          />
          <div className="flex min-h-svh flex-col pt-14">{children}</div>
        </HistoryProvider>
      </Suspense>
    </LocksProvider>
  );
}
