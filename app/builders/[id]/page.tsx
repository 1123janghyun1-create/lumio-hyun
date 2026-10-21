import type { Metadata } from "next";
import { Suspense } from "react";
import BuilderDetailClient from "./BuilderDetailClient";
import { getSupabase } from "@/lib/supabase/db";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://zemix.vercel.app");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!id || id === "preview") {
    return {
      title: "빌더 프로필 | zemix",
      description: "zemix 사이드 프로젝트 메이커",
    };
  }

  let builderName = "빌더 프로필";
  let builderBio = "zemix 사이드 프로젝트 메이커";

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("name, handle, bio, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        builderName = `${data.name} (@${data.handle || "maker"})`;
        builderBio = data.bio || builderBio;
      }
    }
  } catch {}

  return {
    title: `${builderName} | zemix`,
    description: builderBio,
    openGraph: {
      title: `${builderName} | zemix 빌더`,
      description: builderBio,
      url: `${SITE_URL}/builders/${id}`,
    },
  };
}

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default async function BuilderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-16 animate-pulse">
          <div className="h-8 w-32 bg-surface-muted rounded mb-6" />
          <div className="rounded-card border border-border bg-surface p-8 h-48" />
        </div>
      }
    >
      <BuilderDetailClient builderId={id} />
    </Suspense>
  );
}
