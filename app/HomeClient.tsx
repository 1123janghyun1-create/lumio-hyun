"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { HexagonLogo } from "@/components/Icons";
import FeaturedProject from "@/components/FeaturedProject";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/lib/types";
import { getProjects, fetchSharedProjects } from "@/lib/storage";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function HomeClient({ initialProjects = [] }: { initialProjects?: Project[] }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Popular");

  useEffect(() => {
    // If local storage has projects, check them; then fetch shared with user.id
    if (initialProjects.length === 0) {
      setProjects(getProjects());
    }
    fetchSharedProjects(user?.id).then(setProjects);

    const handleSync = () => fetchSharedProjects(user?.id).then(setProjects);
    window.addEventListener("lumio_data_synced", handleSync);
    return () => window.removeEventListener("lumio_data_synced", handleSync);
  }, [user?.id, initialProjects.length]);

  const filterButtons = [
    { label: t("filter.popular"), key: "Popular" },
    { label: t("filter.newest"), key: "Newest" },
    { label: t("filter.mostLiked"), key: "Most Liked" },
    { label: t("filter.recentlyUpdated"), key: "Recently Updated" },
    { label: t("filter.lookingForTesters"), key: "Looking for Testers" },
    { label: t("filter.lookingForTeam"), key: "Looking for Team" },
  ];

  // Filter and sort logic
  const filteredProjects = projects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchTagline = p.tagline.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      const matchAuthor = p.author?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchTagline && !matchTags && !matchAuthor) {
        return false;
      }
    }

    if (activeFilter === "Looking for Testers") {
      return p.lookingForTesters;
    }
    if (activeFilter === "Looking for Team") {
      return p.lookingForTeam;
    }

    return true;
  });

  // Sort
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (activeFilter === "Newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (activeFilter === "Most Liked") {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    if (activeFilter === "Recently Updated") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    // Default Popular
    return ((b.likesCount || 0) * 2 + (b.viewsCount || 0)) - ((a.likesCount || 0) * 2 + (a.viewsCount || 0));
  });

  // Featured project (the one flagged or first one)
  const featured = projects.find((p) => p.isFeatured) || projects[0];

  return (
    <div className="animate-fade-in pb-12">
      {/* Brand Hero Header */}
      <section className="mx-auto max-w-7xl px-6 pt-6 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>zemix</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                사이드 프로젝트 메이커 커뮤니티
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              아이디어를 실제로 빌드하고 런칭하는 메이커들을 위한 공간. 초기 유저 피드백과 함께 성장할 동료를 만나보세요.
            </p>
          </div>
          <Link
            href="/about"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline self-start sm:self-auto shrink-0"
          >
            zemix 소개 및 개발자 이야기 →
          </Link>
        </div>
      </section>

      {/* Mobile About Banner */}
      <Link
        href="/about"
        className="block border-b border-border bg-surface-muted px-6 py-2.5 text-center text-sm font-medium text-primary md:hidden"
      >
        {t("hero.banner")}
      </Link>

      {/* Search & Filter Bar */}
      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[12px] border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filterButtons.map((btn) => {
            const isActive = activeFilter === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setActiveFilter(btn.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-muted hover:border-border-strong"
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Project */}
      {featured && !searchQuery && activeFilter === "Popular" && (
        <FeaturedProject project={featured} />
      )}

      {/* All Projects Section */}
      <section className="mx-auto max-w-7xl border-t border-border px-6 py-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("all.title")}
          </p>
          <span className="text-xs text-muted">
            {sortedProjects.length}개의 프로젝트
          </span>
        </div>

        {sortedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sortedProjects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                onLikeChanged={(id, count) => {
                  setProjects((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, likesCount: count } : p))
                  );
                }}
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-card border border-dashed border-border bg-surface-muted/20 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-surface border border-border shadow-sm mb-4">
              <HexagonLogo className="h-6 w-6 text-foreground" strokeWidth={2.2} />
            </div>
            <h3 className="text-base font-bold text-foreground">
              새로운 사이드 프로젝트를 기다리고 있습니다
            </h3>
            <p className="mt-1.5 max-w-sm text-xs text-muted leading-relaxed">
              zemix는 사이드 프로젝트를 런칭하고 피드백과 동료를 구하는 메이커 커뮤니티입니다. 지금 첫 프로젝트를 등록해보세요.
            </p>
            <Link
              href="/projects/new"
              className="mt-5 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              첫 프로젝트 등록하기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-[16px] border border-dashed border-border bg-surface-muted/30">
            <p className="text-sm font-medium text-muted">
              검색 조건에 일치하는 프로젝트가 없습니다.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("Popular");
              }}
              className="mt-3 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              필터 초기화
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
