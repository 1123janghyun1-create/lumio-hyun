"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Heart,
  Layers,
  MessageSquare,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Printer,
  Flame,
} from "lucide-react";
import { GithubIcon, TwitterIcon } from "@/components/Icons";
import { Builder, Project, CommunityPost } from "@/lib/types";
import { fetchSharedBuilders, fetchSharedProjects, fetchSharedCommunityPosts, toggleFollowBuilder } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { isUserAdmin } from "@/lib/auth";
import ProjectCard from "@/components/ProjectCard";
import { formatRelativeTime } from "@/lib/utils";

export default function BuilderDetailClient({
  builderId,
  initialBuilder,
  initialProjects = [],
  initialPosts = [],
}: {
  builderId: string;
  initialBuilder?: Builder;
  initialProjects?: Project[];
  initialPosts?: CommunityPost[];
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [builder, setBuilder] = useState<Builder | null>(initialBuilder || null);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<"projects" | "community">("projects");
  const [loading, setLoading] = useState(!initialBuilder);
  const [isFollowing, setIsFollowing] = useState(initialBuilder?.isFollowing || false);
  const [followersCount, setFollowersCount] = useState(initialBuilder?.followersCount || 0);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        if (!initialBuilder) {
          setLoading(true);
        }
        const [allBuilders, allProjects, allPosts] = await Promise.all([
          fetchSharedBuilders(user?.id),
          fetchSharedProjects(user?.id),
          fetchSharedCommunityPosts(user?.id),
        ]);

        if (!mounted) return;

        // Find matching builder by id or handle
        let foundBuilder = allBuilders.find(
          (b) => b.id === builderId || b.handle === builderId
        );

        // If not in allBuilders list, try direct API lookup
        if (!foundBuilder) {
          try {
            const res = await fetch(`/api/builders/${encodeURIComponent(builderId)}`);
            if (res.ok) {
              const directData = await res.json();
              if (directData && directData.id) {
                foundBuilder = directData;
              }
            }
          } catch {}
        }

        if (foundBuilder) {
          setBuilder(foundBuilder);
          setIsFollowing(foundBuilder.isFollowing || false);
          setFollowersCount(foundBuilder.followersCount || 0);

          // Filter projects by this builder
          const userProjects = allProjects.filter(
            (p) =>
              p.author?.id === foundBuilder.id ||
              (p as any).user_id === foundBuilder.id ||
              p.author?.handle === foundBuilder.handle
          );
          if (userProjects.length > 0 || initialProjects.length === 0) {
            setProjects(userProjects);
          }

          // Filter community posts by this builder
          const userPosts = allPosts.filter(
            (cp) =>
              cp.author?.id === foundBuilder.id ||
              (cp as any).author_id === foundBuilder.id ||
              cp.author?.handle === foundBuilder.handle
          );
          if (userPosts.length > 0 || initialPosts.length === 0) {
            setCommunityPosts(userPosts);
          }
        } else if (initialBuilder) {
          // Keep server-provided initialBuilder
          setBuilder(initialBuilder);
          setIsFollowing(initialBuilder.isFollowing || false);
          setFollowersCount(initialBuilder.followersCount || 0);
        } else if (user && (user.id === builderId || user.handle === builderId)) {
          // If current logged-in user is this builder
          setBuilder(user);
          setIsFollowing(false);
          setFollowersCount(user.followersCount || 0);

          const userProjects = allProjects.filter(
            (p) =>
              p.author?.id === user.id ||
              (p as any).user_id === user.id ||
              p.author?.handle === user.handle
          );
          setProjects(userProjects);

          const userPosts = allPosts.filter(
            (cp) =>
              cp.author?.id === user.id ||
              (cp as any).author_id === user.id ||
              cp.author?.handle === user.handle
          );
          setCommunityPosts(userPosts);
        }
      } catch (err) {
        console.error("Failed to load builder details:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    const handleSync = () => loadData();
    window.addEventListener("lumio_data_synced", handleSync);
    return () => {
      mounted = false;
      window.removeEventListener("lumio_data_synced", handleSync);
    };
  }, [builderId, user, initialBuilder]);

  const handleFollow = () => {
    if (!user) {
      if (confirm("빌더를 팔로우하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push(`/login?redirect=/builders/${builderId}`);
      }
      return;
    }
    if (!builder || user.id === builder.id) return;

    const res = toggleFollowBuilder(builder.id, user.id);
    setIsFollowing(res.isFollowing);
    setFollowersCount(res.followersCount);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 animate-pulse">
        <div className="h-8 w-32 bg-surface-muted rounded-md mb-8" />
        <div className="rounded-card border border-border bg-surface p-8 mb-8">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-surface-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-surface-muted rounded" />
              <div className="h-4 w-32 bg-surface-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!builder) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-xl font-bold text-foreground">빌더를 찾을 수 없습니다</h2>
        <p className="mt-2 text-sm text-muted">존재하지 않거나 삭제된 빌더 프로필입니다.</p>
        <Link
          href="/builders"
          className="mt-6 inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          빌더 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const isSelf = user && (user.id === builder.id || user.handle === builder.handle);
  const totalLikes = projects.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in pb-20">
      {/* Top Navigation */}
      <div className="mb-6">
        <Link
          href="/builders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>모든 빌더 보기</span>
        </Link>
      </div>

      {/* Builder Profile Header Card */}
      <div className="rounded-card border border-border bg-surface p-6 sm:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <img
              src={builder.avatar}
              alt={builder.name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-border object-cover shrink-0 shadow-sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {builder.name}
                </h1>
                {isUserAdmin(builder) && (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    👑 관리자 (Admin)
                  </span>
                )}
                {builder.isStartingMember && !isUserAdmin(builder) && (
                  <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted">
                    Starting Member
                  </span>
                )}
              </div>
              <p className="text-sm text-muted font-medium mt-0.5">@{builder.handle}</p>
              <div className="inline-block mt-2 rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-semibold">
                {builder.role || "Maker"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:self-start">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-control border border-border px-3.5 py-2 text-xs font-semibold text-muted hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer"
              title="이력서용 포트폴리오 PDF로 저장"
            >
              <Printer className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">포트폴리오 PDF 저장</span>
            </button>

            {isSelf ? (
              <Link
                href="/profile"
                className="rounded-control border border-border bg-surface-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors shadow-sm"
              >
                내 프로필 수정
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleFollow}
                className={`rounded-control px-5 py-2 text-xs font-semibold transition-colors cursor-pointer shadow-sm ${
                  isFollowing
                    ? "bg-surface-muted text-muted hover:text-foreground border border-border"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover"
                }`}
              >
                {isFollowing ? "팔로잉 중" : "+ 팔로우"}
              </button>
            )}

            {builder.socials?.github && (
              <a
                href={builder.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                title="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            )}
            {builder.socials?.twitter && (
              <a
                href={builder.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                title="Twitter"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
            )}
            {builder.socials?.website && (
              <a
                href={builder.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                title="Website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="mt-5 text-sm text-foreground/90 leading-relaxed border-t border-border/50 pt-4 whitespace-pre-line">
          {builder.bio || "zemix 메이커입니다."}
        </p>

        {/* Stats Summary Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-surface-muted/60 border border-border/40">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[11px] text-muted">등록한 프로젝트</p>
              <p className="text-sm font-bold text-foreground">{projects.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-surface-muted/60 border border-border/40">
            <MessageSquare className="h-4 w-4 text-info shrink-0" />
            <div>
              <p className="text-[11px] text-muted">작성한 커뮤니티 글</p>
              <p className="text-sm font-bold text-foreground">{communityPosts.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-surface-muted/60 border border-border/40">
            <Users className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="text-[11px] text-muted">팔로워</p>
              <p className="text-sm font-bold text-foreground">{followersCount}</p>
            </div>
          </div>
        </div>

        {/* Maker Activity Streak (GitHub Grass style) */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>빌더 활동 잔디 (Maker Activity Streak)</span>
            </span>
            <span className="text-[11px] text-muted">최근 16주 활동 기록 • 14일 연속 스트릭 달성 중 🔥</span>
          </div>

          <div className="rounded-xl border border-border/60 bg-surface-muted/40 p-3 overflow-x-auto">
            <div className="flex gap-1 min-w-[500px]">
              {Array.from({ length: 16 }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const activeLevel = (weekIdx * 7 + dayIdx) % 5;
                    const bgClass =
                      activeLevel === 4
                        ? "bg-emerald-500"
                        : activeLevel === 3
                        ? "bg-emerald-400"
                        : activeLevel === 2
                        ? "bg-emerald-300 dark:bg-emerald-600"
                        : activeLevel === 1
                        ? "bg-emerald-100 dark:bg-emerald-900/60"
                        : "bg-surface-muted border border-border/30";
                    return (
                      <div
                        key={dayIdx}
                        className={`h-2.5 w-2.5 rounded-sm ${bgClass}`}
                        title={`활동 레벨: ${activeLevel}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted mt-2 pt-1 border-t border-border/30">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-surface-muted border border-border/30" />
                <span className="h-2 w-2 rounded-sm bg-emerald-100 dark:bg-emerald-900/60" />
                <span className="h-2 w-2 rounded-sm bg-emerald-300 dark:bg-emerald-600" />
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "projects"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>등록한 프로젝트 ({projects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("community")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "community"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>작성한 커뮤니티 글 ({communityPosts.length})</span>
        </button>
      </div>

      {/* Tab Content: Projects */}
      {activeTab === "projects" && (
        <div>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-card border border-dashed border-border bg-surface-muted/20 px-6">
              <Layers className="h-10 w-10 text-muted mb-2 stroke-1" />
              <p className="text-sm font-semibold text-foreground">
                아직 등록한 프로젝트가 없습니다
              </p>
              <p className="mt-1 text-xs text-muted">
                {builder.name}님이 새로운 프로젝트를 공개하면 이곳에 표시됩니다.
              </p>
              {isSelf && (
                <Link
                  href="/projects/new"
                  className="mt-4 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
                >
                  내 프로젝트 등록하기
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Community Posts */}
      {activeTab === "community" && (
        <div className="space-y-4">
          {communityPosts.length > 0 ? (
            communityPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => router.push(`/community?post=${post.id}`)}
                className="rounded-card border border-border bg-surface p-6 shadow-sm hover:shadow-card transition-all cursor-pointer hover:border-primary/40 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-[10px] font-bold">
                    {post.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h3>

                <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
                  {post.content}
                </p>

                {post.imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-[10px] border border-border bg-surface-muted max-h-60">
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full object-cover max-h-60"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted">
                  <span className="text-primary font-medium text-[11px] group-hover:underline">
                    자세히 보기 & 댓글 쓰기 →
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-danger" />
                      <span>{post.likesCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{post.commentsCount || 0}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-card border border-dashed border-border bg-surface-muted/20 px-6">
              <MessageSquare className="h-10 w-10 text-muted mb-2 stroke-1" />
              <p className="text-sm font-semibold text-foreground">
                아직 작성한 커뮤니티 글이 없습니다
              </p>
              <p className="mt-1 text-xs text-muted">
                {builder.name}님이 커뮤니티 라운지에 글을 작성하면 이곳에 모아볼 수 있습니다.
              </p>
              {isSelf && (
                <Link
                  href="/community"
                  className="mt-4 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
                >
                  커뮤니티 라운지 가기
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
