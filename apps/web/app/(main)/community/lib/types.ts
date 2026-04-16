export interface CommunityPresetAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface CommunityPresetItem {
  id: string;
  savedPresetId: string;
  title: string;
  description: string | null;
  presetCode: string;
  base: string;
  likeCount: number;
  isLikedByMe: boolean;
  publishedAt: string;
  tags: string[];
  author: CommunityPresetAuthor;
}

export type CommunitySortOption =
  | "popular-weekly"
  | "popular-monthly"
  | "popular-all"
  | "newest"
  | "oldest";

export type CommunityFilterOption = "all" | "mine" | "liked";
