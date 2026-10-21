import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getSharedProjects } from "@/lib/serverStore";
import { getSupabase, rowToProject } from "@/lib/supabase/db";
import { Project } from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://zemix.vercel.app");

async function getInitialProjects(): Promise<Project[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(rowToProject);
      }
    } catch (e) {
      console.warn("Supabase SSR projects fetch error:", e);
    }
  }
  return getSharedProjects();
}

export const instant = false;

export const metadata: Metadata = {
  title: "zemix — 사이드 프로젝트 메이커 커뮤니티",
  description:
    "zemix(제믹스, zemix.vercel.app)는 사이드 프로젝트를 런칭하고 초기 유저 피드백과 동료를 구하는 공식 메이커 커뮤니티 플랫폼입니다. SchoolEcho, zemix 등 메이커들의 사이드 프로젝트를 발견하고 함께 만들어보세요.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    title: "zemix — 사이드 프로젝트 메이커 커뮤니티",
    description: "유저를 만나고, 함께 만드는 사이드 프로젝트 플랫폼 (zemix.vercel.app)",
    siteName: "zemix",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "zemix — 사이드 프로젝트 메이커 커뮤니티",
        type: "image/png",
      },
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "zemix logo",
        type: "image/png",
      },
    ],
  },
};

export default async function HomePage() {
  const initialProjects = await getInitialProjects();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "zemix",
    alternateName: ["Zemix", "제믹스", "zemix.vercel.app", "제믹스 커뮤니티"],
    url: SITE_URL,
    description: "사이드 프로젝트 메이커 커뮤니티 플랫폼 (zemix.vercel.app)",
    publisher: {
      "@type": "Organization",
      name: "zemix",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
        width: 512,
        height: 512,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/explore?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "zemix 사이드 프로젝트 목록",
    description: "zemix에 등록된 최신 사이드 프로젝트 목록",
    numberOfItems: initialProjects.length,
    itemListElement: initialProjects.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: p.title,
      description: p.tagline || p.description?.slice(0, 100),
      url: `${SITE_URL}/projects/${p.id}`,
      image: p.coverImage || p.logo || `${SITE_URL}/icon.png`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {initialProjects.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <HomeClient initialProjects={initialProjects} />
    </>
  );
}
