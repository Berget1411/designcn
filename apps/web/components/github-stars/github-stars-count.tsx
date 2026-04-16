import { cache } from "react";
import { GitHubStars } from "./github-stars";
import { siteConfig } from "@/lib/config";

const REPO = siteConfig.links.github.replace("https://github.com/", "");

const fetchStars = cache(async (): Promise<number> => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      next: { revalidate: 3600 },
      headers: process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {},
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.stargazers_count ?? 0;
  } catch {
    return 0;
  }
});

export async function GitHubStarsCount() {
  const stars = await fetchStars();
  return <GitHubStars repo={REPO} stargazersCount={stars} />;
}
