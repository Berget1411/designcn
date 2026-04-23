import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ENABLE_AI } from "@/lib/features";
import { AiChat } from "./ai-chat";

export default function AiPage() {
  if (!ENABLE_AI) redirect("/");

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col pt-14">
      <Suspense fallback={null}>
        <AiChat />
      </Suspense>
    </div>
  );
}
