import { redirect } from "next/navigation";
import { ENABLE_AI } from "@/lib/features";

export default function AiFormGeneratorPage() {
  if (!ENABLE_AI) redirect("/");
  redirect("/ai?mode=form");
}
