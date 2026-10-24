"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, Flame, Heart, Eye, ArrowUpRight, Sparkles, Crown } from "lucide-react";
import { Project } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

export default function LeaderboardPage() {
  const { language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "allTime">("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        const list: Project[] = data.projects || (Array.isArray(data) ? data : []);
        // Sort by likesCount descending
        const sorted = [...list].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        setProjects(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top3 = projects.slice(0, 3);
  const remaining = projects.slice(3);

  const getTrophyBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-amber-400/30">
          🥇
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-300 text-slate-950 font-black text-sm shadow-md">
          🥈
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-700 text-white font-black text-sm shadow-md">
          🥉
        </span>
      );
    }
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-muted text-muted font-bold text-xs">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold mb-3 border border-amber-500/20">
          <Trophy className="h-3.5 w-3.5" />
          <span>{language === "ko" ? "Hall of Fame • 명예의 전당" : "Hall of Fame • Top Projects"}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
          {language === "ko" ? "주간 & 월간 명예의 전당" : "Weekly & Monthly Leaderboard"}
        </h1>
        <p className="text-xs md:text-sm text-muted mt-2">
          {language === "ko"
            ? "빌더 커뮤니티에서 가장 많은 응원과 사랑을 받은 최고의 사이드 프로젝트를 소개합니다."
            : "Discover the top-voted side projects created by passionate indie makers."}
        </p>

        {/* Period Switcher */}
        <div className="inline-flex items-center gap-1 rounded-xl bg-surface-muted p-1 mt-6 border border-border">
          <button
            onClick={() => setPeriod("weekly")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              period === "weekly"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {language === "ko" ? "이번 주 랭킹 🔥" : "This Week 🔥"}
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              period === "monthly"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {language === "ko" ? "이번 달 랭킹 ⭐" : "This Month ⭐"}
          </button>
          <button
            onClick={() => setPeriod("allTime")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              period === "allTime"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {language === "ko" ? "역대 명예의 전당 👑" : "All Time 👑"}
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="order-2 md:order-1 rounded-2xl border border-slate-700/60 bg-surface p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-3 left-3">{getTrophyBadge(1)}</div>
              <img
                src={top3[1].logo || "/icon.svg"}
                alt={top3[1].title}
                className="h-16 w-16 rounded-2xl border border-border object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <h3 className="text-base font-bold text-foreground mt-3">{top3[1].title}</h3>
              <p className="text-xs text-muted line-clamp-2 mt-1">{top3[1].tagline}</p>
              <div className="flex items-center gap-3 mt-4 text-xs font-bold">
                <span className="text-rose-500">❤️ {top3[1].likesCount}</span>
                <span className="text-muted">👀 {top3[1].viewsCount}</span>
              </div>
              <Link
                href={`/projects/${top3[1].id}`}
                className="mt-4 w-full rounded-xl border border-border py-2 text-xs font-semibold hover:bg-surface-muted transition-colors"
              >
                상세보기
              </Link>
            </div>
          )}

          {/* 1st Place (Featured & Higher) */}
          {top3[0] && (
            <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-400/80 bg-surface p-7 shadow-xl shadow-amber-400/10 flex flex-col items-center text-center relative overflow-hidden group -translate-y-2">
              <div className="absolute top-3 left-3">{getTrophyBadge(0)}</div>
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-500">
                <Crown className="h-3.5 w-3.5" />
                <span>주간 1위</span>
              </div>
              <img
                src={top3[0].logo || "/icon.svg"}
                alt={top3[0].title}
                className="h-20 w-20 rounded-2xl border-2 border-amber-400/50 object-cover shadow-md group-hover:scale-105 transition-transform"
              />
              <h3 className="text-lg font-black text-foreground mt-3">{top3[0].title}</h3>
              <p className="text-xs text-muted line-clamp-2 mt-1">{top3[0].tagline}</p>
              <div className="flex items-center gap-4 mt-4 text-xs font-bold">
                <span className="text-rose-500 text-sm">❤️ {top3[0].likesCount}</span>
                <span className="text-muted text-sm">👀 {top3[0].viewsCount}</span>
              </div>
              <Link
                href={`/projects/${top3[0].id}`}
                className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-400/30 hover:bg-amber-300 transition-colors"
              >
                1위 프로젝트 둘러보기 🚀
              </Link>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="order-3 rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-3 left-3">{getTrophyBadge(2)}</div>
              <img
                src={top3[2].logo || "/icon.svg"}
                alt={top3[2].title}
                className="h-16 w-16 rounded-2xl border border-border object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <h3 className="text-base font-bold text-foreground mt-3">{top3[2].title}</h3>
              <p className="text-xs text-muted line-clamp-2 mt-1">{top3[2].tagline}</p>
              <div className="flex items-center gap-3 mt-4 text-xs font-bold">
                <span className="text-rose-500">❤️ {top3[2].likesCount}</span>
                <span className="text-muted">👀 {top3[2].viewsCount}</span>
              </div>
              <Link
                href={`/projects/${top3[2].id}`}
                className="mt-4 w-full rounded-xl border border-border py-2 text-xs font-semibold hover:bg-surface-muted transition-colors"
              >
                상세보기
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Ranks 4+ List */}
      <div className="mt-10 rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="p-4 border-b border-border text-xs font-bold text-muted uppercase tracking-wider flex items-center justify-between">
          <span>랭킹 순위</span>
          <span>프로젝트 & 지표</span>
        </div>

        <div className="divide-y divide-border">
          {projects.map((p, idx) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex items-center justify-between p-4 hover:bg-surface-muted transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 flex justify-center">{getTrophyBadge(idx)}</div>
                <img
                  src={p.logo || "/icon.svg"}
                  alt={p.title}
                  className="h-10 w-10 rounded-xl border border-border object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-xs text-muted max-w-md truncate">{p.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-rose-500">❤️ {p.likesCount}</span>
                <span className="text-muted hidden sm:inline-block">👀 {p.viewsCount}</span>
                <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
