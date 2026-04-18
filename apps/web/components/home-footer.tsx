import * as React from "react";
import Link from "next/link";

import { siteConfig } from "@/lib/config";
import { cn } from "@workspace/ui/lib/utils";

const footerLinks = [
  { href: "/create", label: "Create" },
  { href: "/community", label: "Community" },
  { href: "/pricing", label: "Pricing" },
];

export function HomeFooter() {
  return (
    <footer className="w-full overflow-x-clip">
      <div className="screen-line-top relative box-border border-x border-line pt-4">
        <p className="px-4 text-center text-sm text-balance text-muted-foreground">
          {siteConfig.description}
        </p>

        <p className="mt-1 px-4 text-center text-sm text-balance text-muted-foreground">
          Built for Designcn. Source available on{" "}
          <a
            className="font-medium underline decoration-current/30 underline-offset-3 transition-colors hover:text-foreground hover:decoration-current"
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>

        <div className="screen-line-top screen-line-bottom mt-4 flex w-full before:z-1 after:z-1">
          <div className="mx-auto box-border w-full max-w-full border-x border-line bg-background px-4 sm:w-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3 text-sm text-muted-foreground sm:flex-nowrap sm:gap-0">
              {footerLinks.map((item, index) => (
                <React.Fragment key={item.href}>
                  {index > 0 && <FooterRailSeparator className="hidden sm:flex" />}
                  <Link href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </React.Fragment>
              ))}

              <FooterRailSeparator className="hidden sm:flex" />

              <a
                className="transition-colors hover:text-foreground"
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="absolute right-[-4.5px] bottom-[-3.5px] z-2 flex size-2 border border-line bg-background" />
        <div className="absolute bottom-[-3.5px] left-[-4.5px] z-2 flex size-2 border border-line bg-background" />
      </div>
    </footer>
  );
}

function FooterRailSeparator({ className }: { className?: string }) {
  return <div className={cn("mx-4 h-5 w-px bg-line", className)} aria-hidden="true" />;
}
