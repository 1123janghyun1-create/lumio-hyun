"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lightbulb, GitFork, Plus, Sparkles, MessageCircle, Heart } from "lucide-react";
import { GithubIcon } from "@/components/Icons";

interface Idea {
  id: string;
  title: string;
  summary: string;
  reason: string;
  suggestedStack: string[];
  author: string;
  authorAvatar: string;
  githubUrl?: string;
  contactUrl?: string;
  forksCount: number;
}

const INITIAL_IDEAS: Idea[] = [
  {
    id: "idea-1",
    title: "AI 깃허브 커밋 메시지 감정 분석 봇",
    summary: "개발 팀원들의 깃허브 커밋 메시지 톤앤매너를 분석해 이번 주 번아웃 위험도나 스트레스 지수를 대시보드로 시각화해 주는 슬랙 봇.",
    reason: "직장 이직으로 인해 여유 시간이 부족해져 프론트엔드 대시보드 프로토타입까지만 개발하고 중단했습니다. 누구든 이어받아 완성해 주세요!",
    suggestedStack: ["Next.js", "GitHub API", "Slack Bolt", "Supabase"],
    author: "박상우",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80",
    githubUrl: "https://github.com",
    contactUrl: "mailto:builder@zemix.kr",
    forksCount: 14,
  },
  {
    id: "idea-2",
    title: "반려동물 실시간 산책 코스 안전 지도",
    summary: "유리 조각, 길고양이 다발 구역, 급경사 계단 등 동네 주민들이 위험 스팟을 실시간 핀으로 찍어 공유하는 커뮤니티 지도 웹앱.",
    reason: "지도 API 비용과 초기 사용자 유치 마케팅 한계로 멈췄습니다. 반려동물 좋아하시는 풀스택 개발자분이 계시다면 오픈소스로 가져가세요.",
    suggestedStack: ["React", "Kakao Map API", "Tailwind CSS"],
    author: "최유나",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80",
    githubUrl: "https://github.com",
    contactUrl: "mailto:builder@zemix.kr",
    forksCount: 22,
  },
  {
    id: "idea-3",
    title: "대학생 스터디 룸 예약 빈자리 줍줍 알리미",
    summary: "대학교 도서관/열람실 및 스터디 카페의 당일 취소 빈자리가 생기면 텔레그램이나 카톡으로 즉시 푸시 알림을 쏴주는 크롤러 서비스.",
    reason: "졸업 후 취업 준비를 하느라 유지보수가 어려워졌습니다. 대학교 후배들이나 동아리에서 이어서 서비스하면 반응 폭발할 아이템입니다.",
    suggestedStack: ["Python", "FastAPI", "Selenium", "Telegram Bot"],
    author: "정현우",
    authorAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&auto=format&fit=crop&q=80",
    githubUrl: "https://github.com",
    contactUrl: "mailto:builder@zemix.kr",
    forksCount: 38,
  },
];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>(INITIAL_IDEAS);
  const [forkedIds, setForkedIds] = useState<Record<string, boolean>>({});

  const handleFork = (id: string) => {
    setForkedIds((prev) => {
      const isFork = !prev[id];
      setIdeas((list) =>
        list.map((it) =>
          it.id === id ? { ...it, forksCount: it.forksCount + (isFork ? 1 : -1) } : it
        )
      );
      return { ...prev, [id]: isFork };
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-3 border border-emerald-500/20">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Idea Graveyard & Revival • 아이디어 부활</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
            아이디어 묘지 & 부활 (Fork)
          </h1>
          <p className="text-xs md:text-sm text-muted mt-2 max-w-2xl">
            "아이디어는 너무 좋은데 시간이 없어서 멈춘 프로젝트"들을 기부하고, 다른 빌더가 이어받아(Fork) 세상에 런칭할 수 있는 오픈 기부 공간입니다.
          </p>
        </div>

        <button
          onClick={() => alert("미완성 아이디어 등록 기능 준비 중입니다! community 탭에 먼저 아이디어를 공유해 보세요.")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>내 미완성 아이디어 기부</span>
        </button>
      </div>

      {/* Ideas Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas.map((idea) => {
          const isForked = forkedIds[idea.id];
          return (
            <div
              key={idea.id}
              className="rounded-2xl border border-border bg-surface p-6 flex flex-col justify-between hover:border-border-strong hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">{idea.title}</h3>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                    <GitFork className="h-3.5 w-3.5 text-primary" />
                    <span>{idea.forksCount}명 이어받음</span>
                  </span>
                </div>

                <p className="text-xs md:text-sm text-foreground/90 mt-2.5 leading-relaxed">
                  {idea.summary}
                </p>

                {/* Reason why stopped */}
                <div className="mt-4 rounded-xl bg-surface-muted p-3 border border-border/60">
                  <span className="text-[11px] font-bold text-amber-500 block mb-0.5">
                    ⚠️ 중단 사유 및 상태
                  </span>
                  <p className="text-xs text-muted leading-relaxed">{idea.reason}</p>
                </div>

                {/* Suggested Stacks */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {idea.suggestedStack.map((stk) => (
                    <span
                      key={stk}
                      className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
                    >
                      {stk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={idea.authorAvatar}
                    alt={idea.author}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <span className="text-xs text-muted font-medium">원작자: {idea.author}</span>
                </div>

                <div className="flex items-center gap-2">
                  {idea.githubUrl && (
                    <a
                      href={idea.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border p-2 text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                      title="깃허브 소스코드 보기"
                    >
                      <GithubIcon className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleFork(idea.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      isForked
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
                    }`}
                  >
                    <GitFork className="h-3.5 w-3.5" />
                    <span>{isForked ? "이어받기 완료! 🚀" : "이어서 개발하기 (Fork)"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
