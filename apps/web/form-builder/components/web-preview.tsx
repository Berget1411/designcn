import type React from "react";
import { Lock } from "lucide-react";

interface WebPreviewProps {
  children: React.ReactNode;
  url?: string;
}

export function WebPreview({ children, url = "/form-preview" }: WebPreviewProps) {
  return (
    <div className="w-full overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/85 shadow-xl ring-1 ring-foreground/5 backdrop-blur-sm">
      <div className="border-b border-border/70 bg-card/85 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/90"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/90"></div>
            <div className="h-3 w-3 rounded-full bg-green-500/90"></div>
          </div>
          <div className="mx-2 flex-1 md:mx-4">
            <div className="flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1.5 shadow-sm">
              <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{url}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-muted/45">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundSize: "18px 18px",
            backgroundImage: "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
          }}
        />
        <div className="relative p-2 md:p-3">
          <div className="rounded-[1.5rem] border border-border/60 bg-background/88 p-2 shadow-sm backdrop-blur-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
