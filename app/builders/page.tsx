import type { Metadata } from "next";
import BuildersClient from "./BuildersClient";
import { getSharedBuilders } from "@/lib/serverStore";
import { getSupabase } from "@/lib/supabase/db";
import { Builder } from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://zemix.vercel.app");

async function getInitialBuilders(): Promise<Builder[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: profiles, error: pError } = await (supabase as any)
        .from("profiles")
        .select("*");

      if (!pError && Array.isArray(profiles)) {
        const realProfiles = profiles.filter((p: any) => !p.id.startsWith("builder-"));
        return realProfiles.map((p: any) => ({
          id: p.id,
          name: p.name || "Maker",
          handle: p.handle || "maker",
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          bio: p.bio || "zemix 메이커",
          role: p.role || "Maker",
          isStartingMember: p.is_starting_member ?? true,
          followersCount: p.followers_count || 0,
          isFollowing: false,
          projectsCount: 0,
          totalLikes: 0,
          socials: {
            github: p.github_url,
            twitter: p.twitter_url,
            website: p.website_url,
          },
        }));
      }
    } catch (e) {
      console.warn("Supabase SSR builders error:", e);
    }
  }
  return getSharedBuilders();
}

export const instant = false;

export const metadata: Metadata = {
  title: "빌더 (Builders) — zemix 사이드 프로젝트 메이커들",
  description:
    "실제 사이드 프로젝트를 만들고 서비스로 런칭하고 있는 zemix의 메이커와 개발자들을 만나보세요. 팔로우하고 협업을 제안할 수 있습니다.",
  alternates: {
    canonical: `${SITE_URL}/builders`,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${SITE_URL}/builders`,
    title: "빌더 (Builders) | zemix",
    description: "사이드 프로젝트 메이커와 개발자들을 만나보세요.",
    siteName: "zemix",
  },
};

export default async function BuildersPage() {
  const initialBuilders = await getInitialBuilders();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "zemix 빌더 목록",
    numberOfItems: initialBuilders.length,
    itemListElement: initialBuilders.map((b, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: b.name,
      description: b.bio,
      url: `${SITE_URL}/builders/${b.id}`,
      image: b.avatar,
    })),
  };

  return (
    <>
      {initialBuilders.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <BuildersClient initialBuilders={initialBuilders} />
    </>
  );
}
