import type { Metadata } from "next";
import { Suspense } from "react";
import ProjectDetailClient from "./ProjectDetailClient";
import { getSharedProjectById } from "@/lib/serverStore";
import { getSupabase, rowToProject } from "@/lib/supabase/db";
import { Project } from "@/lib/types";

export const instant = false;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://zemix.vercel.app");

async function getProject(id: string): Promise<Project | null> {
  if (!id || id === "preview") return null;
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) {
        return rowToProject(data);
      }
    } catch {}
  }
  const local = getSharedProjectById(id);
  return local || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "프로젝트를 찾을 수 없습니다 — zemix",
      description: "삭제되었거나 존재하지 않는 프로젝트입니다.",
      robots: { index: false, follow: true },
    };
  }

  const title = `${project.title} — ${project.tagline || "zemix 메이커 프로젝트"}`;
  const description =
    project.description?.slice(0, 160) ||
    project.tagline ||
    `${project.title} - zemix에서 확인하고 피드백을 남겨보세요.`;
  const pageUrl = `${SITE_URL}/projects/${project.id}`;
  const image = project.coverImage || project.logo || `${SITE_URL}/icon.png`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: pageUrl,
      title: `${project.title} | zemix`,
      description,
      siteName: "zemix",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | zemix`,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  const jsonLd = project
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: project.title,
        headline: project.tagline,
        description: project.description,
        image: project.coverImage || project.logo,
        url: `${SITE_URL}/projects/${project.id}`,
        applicationCategory: project.tags?.[0] || "WebApplication",
        operatingSystem: "Web",
        author: {
          "@type": "Person",
          name: project.author?.name || "zemix 메이커",
          url: project.author?.socials?.website || `${SITE_URL}/builders`,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "KRW",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 py-8 animate-pulse">
            <div className="h-8 w-48 bg-surface-muted rounded mb-6" />
            <div className="h-64 bg-surface-muted rounded-card mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-surface-muted rounded-card" />
                <div className="h-48 bg-surface-muted rounded-card" />
              </div>
              <div className="h-64 bg-surface-muted rounded-card" />
            </div>
          </div>
        }
      >
        <ProjectDetailClient projectId={id} initialProject={project || undefined} />
      </Suspense>
    </>
  );
}
