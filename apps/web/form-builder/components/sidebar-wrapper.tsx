"use client";

import { FaArrowLeft } from "react-icons/fa6";
import { ModeToggle } from "@/components/mode-toggle";
import { ScrollFadeEffect } from "@/components/scroll-fade-effect";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SidebarWrapperProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  description?: React.ReactNode;
  headerAction?: React.ReactNode;
  menu?: React.ReactNode;
  title?: React.ReactNode;
}

export function SidebarWrapper({
  children,
  className,
  contentClassName,
  description,
  headerAction,
  menu,
  title,
}: SidebarWrapperProps) {
  const isMobile = useIsMobile();

  return (
    <Card
      className={cn(
        "dark h-full min-h-0 rounded-2xl bg-card/90 shadow-xl backdrop-blur-xl",
        className,
      )}
      size="sm"
    >
      {menu || title || description || headerAction ? (
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
          {menu ? (
            <div className="min-w-0 flex-1">{menu}</div>
          ) : (
            <div className="min-w-0 flex-1">
              {title ? <CardTitle className="text-sm">{title}</CardTitle> : null}
              {description ? (
                <CardDescription className="pt-1 text-xs leading-relaxed">
                  {description}
                </CardDescription>
              ) : null}
            </div>
          )}
          {headerAction ? <div>{headerAction}</div> : null}
        </CardHeader>
      ) : null}

      <CardContent className="flex min-h-0 flex-1 flex-col px-0">
        {!isMobile ? (
          <ScrollFadeEffect
            className={cn(
              "h-full px-3 pb-4",
              menu || title || description || headerAction ? "pt-3" : "pt-4",
              contentClassName,
            )}
          >
            {children}
          </ScrollFadeEffect>
        ) : (
          <div
            className={cn(
              "h-full overflow-y-auto px-3 pb-4",
              menu || title || description || headerAction ? "pt-3" : "pt-4",
              contentClassName,
            )}
          >
            {children}
          </div>
        )}
      </CardContent>

      <CardFooter className="hidden min-w-0 shrink-0 items-center gap-2 border-t md:flex">
        <Button
          size="sm"
          onClick={() => window.history.back()}
          variant="outline"
          className="grow justify-center gap-2"
        >
          <FaArrowLeft />
          Back
        </Button>
        <ModeToggle />
      </CardFooter>
    </Card>
  );
}
