import type { Metadata } from "next";
import { PresetsPage } from "./components/presets-page";

export const metadata: Metadata = {
  title: "My Presets — Designcn",
  description: "Manage your saved design system presets.",
};

export default function Page() {
  return <PresetsPage />;
}
