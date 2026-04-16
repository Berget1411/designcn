import type { Metadata } from "next";
import { CommunityPage } from "./components/community-page";

export const metadata: Metadata = {
  title: "Community Presets — Designcn",
  description: "Browse, share, and apply community design system presets.",
};

export default function Page() {
  return <CommunityPage />;
}
