import * as React from "react";
import { MdInfo } from "react-icons/md";

import { cn } from "@/lib/utils";

interface FormStudioShellProps extends React.ComponentProps<"div"> {
  bodyClassName?: string;
  notice?: React.ReactNode;
}

export function FormStudioShell({
  children,
  className,
  bodyClassName,
  notice = "The form builder works best on desktop",
  ...props
}: FormStudioShellProps) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-svh flex-col overflow-hidden pt-14 section-soft [--gap:--spacing(4)] md:[--gap:--spacing(6)]",
        className,
      )}
      {...props}
    >
      {notice ? (
        <div className="border-b border-border/60 bg-background/80 px-(--gap) py-2 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MdInfo className="size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-(--gap) p-(--gap) pt-[calc(var(--gap)*0.5)]",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
