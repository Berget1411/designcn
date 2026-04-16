import { Header } from "@/components/header";
import { GitHubStarsCount } from "@/components/github-stars/github-stars-count";
import { Suspense } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header
        stars={
          <Suspense fallback={null}>
            <GitHubStarsCount />
          </Suspense>
        }
      />
      {children}
    </>
  );
}
