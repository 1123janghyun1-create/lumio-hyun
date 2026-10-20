"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Megaphone,
  HelpCircle,
  Users,
  MessageSquare,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Share2,
  ChevronDown,
} from "lucide-react";
import { HexagonLogo } from "@/components/Icons";

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "zemix는 무료로 이용할 수 있나요?",
      a: "네, zemix는 모든 메이커와 사용자가 100% 무료로 이용할 수 있는 열린 플랫폼입니다. 프로젝트 등록, 피드백 수집, 팀원 모집, 인사이트 분석까지 어떤 제한 없이 자유롭게 활용하실 수 있습니다.",
    },
    {
      q: "아직 완성되지 않은 아이디어나 MVP도 등록할 수 있나요?",
      a: "물론입니다! zemix는 완성된 프로덕트뿐만 아니라 아이디어 구상 단계, 프로토타입, 초기 베타 테스트 단계의 프로젝트를 가장 환영합니다. 초기부터 실제 사용자의 피드백을 받으며 함께 키워나가는 것이 zemix의 핵심 가치입니다.",
    },
    {
      q: "트렌딩 랭킹 알고리즘은 어떻게 작동하나요?",
      a: "단순히 누적 좋아요 수만 세는 것이 아니라, 최근에 발생한 좋아요, 건설적인 피드백, 댓글 소통 반응과 시간 감쇠(Time Decay) 공식을 결합하여 지속적으로 업데이트되고 활발히 소통하는 신규 프로젝트가 상위에 공정하게 노출됩니다.",
    },
    {
      q: "홍보용 추적 링크(/go/프로젝트ID)는 무엇인가요?",
      a: "내 프로젝트 상세 페이지의 '공유' 버튼이나 외부(트위터, 디스코드, 링크드인 등)에 zemix/go/프로젝트ID 링크를 공유하면, 외부에서 내 실제 서비스로 넘어가는 아웃바운드 클릭수와 유입 경로를 프로젝트 인사이트 탭에서 실시간으로 확인할 수 있습니다.",
    },
  ];

  return (
    <div className="animate-fade-in pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-border">
        {/* Glow Blurs Background */}
        <div
          className="pointer-events-none absolute inset-x-0 -z-10 overflow-hidden"
          style={{
            top: "-6rem",
            bottom: "-6rem",
            maskImage: "radial-gradient(ellipse 60% 60% at 50% 45%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 45%, black 30%, transparent 75%)",
          }}
          aria-hidden="true"
        >
          <div
            className="absolute left-[12%] top-[15%] h-72 w-72 rounded-full opacity-60 blur-3xl sm:h-[26rem] sm:w-[26rem]"
            style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}
          />
          <div
            className="absolute right-[10%] top-[10%] h-64 w-64 rounded-full opacity-50 blur-3xl sm:h-80 sm:w-80"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #A855F7)" }}
          />
          <div
            className="absolute left-1/2 top-[55%] h-64 w-64 -translate-x-1/2 rounded-full opacity-45 blur-3xl sm:h-[22rem] sm:w-[22rem]"
            style={{ background: "linear-gradient(135deg, #38BDF8, #22D3EE)" }}
          />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm mb-6">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary">
              <HexagonLogo className="h-2.5 w-2.5" strokeWidth={2.5} />
            </span>
            <span>Meet users. Build together.</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.18] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            On{" "}
            <span
              className="whitespace-nowrap bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 bg-clip-text text-transparent font-black"
            >
              zemix
            </span>
            ,<br />
            Build it, show it, grow it together
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            아이디어에서 첫 런칭까지, zemix에서 첫 사용자를 만나보세요. 프로젝트 등록, 유저 피드백 추적, 팀원 및 테스터 매칭, 실시간 트렌딩 노출과 유입 경로 인사이트까지 — 사이드 프로젝트 성장에 필요한 모든 것을 한곳에서 제공합니다.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/projects/new"
              className="rounded-[12px] bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md cursor-pointer"
            >
              프로젝트 등록하기
            </Link>
            <Link
              href="/explore"
              className="rounded-[12px] border border-border bg-surface px-7 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:bg-surface-muted cursor-pointer"
            >
              프로젝트 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="mx-auto max-w-5xl px-6 pt-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            THE PROBLEM
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            사이드 프로젝트를 만들며 이런 어려움이 있으셨나요?
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 rounded-[16px] border border-border bg-surface p-6 text-center shadow-card hover:shadow-hover transition-all">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <Megaphone className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-foreground text-sm">소셜 미디어의 침묵</h3>
            <p className="text-xs text-muted leading-relaxed">
              열심히 만든 프로젝트를 SNS에 올려도 반응이 없고 순식간에 피드 아래로 사라집니다.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-[16px] border border-border bg-surface p-6 text-center shadow-card hover:shadow-hover transition-all">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <HelpCircle className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-foreground text-sm">피드백 부재</h3>
            <p className="text-xs text-muted leading-relaxed">
              누구에게 물어봐야 첫 사용자 관점의 솔직하고 구체적인 개선 의견을 얻을 수 있을지 막막합니다.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-[16px] border border-border bg-surface p-6 text-center shadow-card hover:shadow-hover transition-all">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <Users className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-foreground text-sm">팀원 매칭의 벽</h3>
            <p className="text-xs text-muted leading-relaxed">
              함께 아이디어를 디벨롭할 디자이너나 프론트엔드/백엔드 동료를 찾기가 어렵습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Why Zemix Section */}
      <section className="mx-auto max-w-5xl px-6 pt-24">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            WHY ZEMIX
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            zemix가 다른 플랫폼과 다른 점
          </h2>
        </div>

        <div className="mt-14 flex flex-col gap-16">
          {/* Item 1 */}
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            <div className="flex-1 text-center sm:text-left">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
              >
                1
              </span>
              <h3 className="mt-3 text-xl font-bold text-foreground">
                완성되지 않아도 괜찮습니다
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                완벽한 최종 결과물이어야만 공개할 수 있는 게 아닙니다. 번뜩이는 아이디어 한 줄, 주말 동안 만든 반쪽짜리 프로토타입도 환영합니다. 초기 단계부터 메이커와 유저가 함께 만들어가는 공간입니다.
              </p>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="w-full max-w-xs rounded-card border border-border bg-surface p-5 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day 1</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-lg bg-primary-soft">
                    🌱
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">FocusLoop</p>
                    <p className="truncate text-xs text-muted">🚀 프로젝트 등록 완료</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>❤️ 0 likes</span>
                  <span>👥 0 followers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:flex-row-reverse">
            <div className="flex-1 text-center sm:text-left">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
              >
                2
              </span>
              <h3 className="mt-3 text-xl font-bold text-foreground">
                프로젝트가 계속 자라납니다
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                한 번 올리고 잊혀지는 게시판이 아닙니다. 타임라인에 업데이트를 기록하고, 팔로워들에게 알림을 보내며 프로젝트가 살아 숨쉬는 지속적인 공간으로 발전합니다.
              </p>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="w-full max-w-sm rounded-card border border-border bg-surface p-4 shadow-card space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-foreground">v1.2.0 신규 업데이트</span>
                </div>
                <p className="text-xs text-muted">유저 건의사항을 반영하여 다크모드 및 모바일 최적화를 완료했습니다.</p>
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  3일 전 • 좋아요 8개
                </div>
              </div>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            <div className="flex-1 text-center sm:text-left">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
              >
                3
              </span>
              <h3 className="mt-3 text-xl font-bold text-foreground">
                흩어지지 않는 체계적 피드백
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                댓글란에 묻히지 않습니다. 제안된 아이디어와 버그 리포트는 'Open', 'In Progress', 'Done' 상태로 체계적으로 추적되며, 다른 사용자들의 찬반 투표(Upvote)로 우선순위를 명확히 파악할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="w-full max-w-sm rounded-card border border-border bg-surface p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Feedback Status</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-[8px] border border-border p-2 text-xs">
                    <span className="truncate text-foreground max-w-[200px]">다크모드 버튼 대비 개선</span>
                    <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">Open</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[8px] border border-border p-2 text-xs">
                    <span className="truncate text-foreground max-w-[200px]">모바일 터치 딜레이 보정</span>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">In progress</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[8px] border border-border p-2 text-xs">
                    <span className="truncate text-foreground max-w-[200px]">로딩 속도 2배 개선</span>
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">Done</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-5xl px-6 pt-24">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            WHO IT'S FOR
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            zemix는 누구를 위한 공간인가요?
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-4 py-3.5 text-sm text-foreground shadow-sm">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              ✦
            </span>
            혼자서 사이드 프로젝트를 만드는 솔로 개발자
          </div>
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-4 py-3.5 text-sm text-foreground shadow-sm">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              ✦
            </span>
            실제 반응을 확인하고 포트폴리오를 증명할 디자이너
          </div>
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-4 py-3.5 text-sm text-foreground shadow-sm">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              ✦
            </span>
            첫 유저와 팀원을 찾는 초기 창업자 및 인디 해커
          </div>
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-4 py-3.5 text-sm text-foreground shadow-sm">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              ✦
            </span>
            새로운 프로덕트를 먼저 써보고 아이디어를 더해줄 테스터
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pt-24">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            HOW IT WORKS
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            zemix를 시작하는 간단한 5단계
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card flex flex-col justify-between">
            <div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mb-3">1</span>
              <h3 className="font-bold text-foreground text-base mb-1.5">프로젝트 등록</h3>
              <p className="text-xs text-muted leading-relaxed">
                5분이면 충분합니다. 이름, 한 줄 소개, 이미지와 링크만 입력하면 즉시 공개됩니다.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card flex flex-col justify-between">
            <div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mb-3">2</span>
              <h3 className="font-bold text-foreground text-base mb-1.5">피드백 수렴</h3>
              <p className="text-xs text-muted leading-relaxed">
                아이디어 건의, 버그 신고, 칭찬을 체계적으로 분류하고 투표를 통해 우선순위를 정합니다.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card flex flex-col justify-between">
            <div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mb-3">3</span>
              <h3 className="font-bold text-foreground text-base mb-1.5">팀원 & 테스터 모집</h3>
              <p className="text-xs text-muted leading-relaxed">
                '팀원 구인 중' 및 '테스터 모집 중' 플래그를 켜서 뜻이 맞는 동료를 만납니다.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card flex flex-col justify-between">
            <div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mb-3">4</span>
              <h3 className="font-bold text-foreground text-base mb-1.5">타임라인 업데이트</h3>
              <p className="text-xs text-muted leading-relaxed">
                버전별 개선 일지를 등록하여 프로젝트가 지속적으로 발전하는 스토리를 축적합니다.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card flex flex-col justify-between">
            <div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mb-3">5</span>
              <h3 className="font-bold text-foreground text-base mb-1.5">인사이트 & 추적</h3>
              <p className="text-xs text-muted leading-relaxed">
                방문자 유입 경로와 아웃바운드 전환율(/go/링크)을 분석해 프로덕트 성장을 측정합니다.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-dashed border-primary/40 bg-primary-soft/30 p-6 flex flex-col items-center justify-center text-center">
            <Sparkles className="h-7 w-7 text-primary mb-2" />
            <h3 className="font-bold text-foreground text-sm">지금 바로 시작하세요</h3>
            <Link
              href="/projects/new"
              className="mt-3 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover"
            >
              새 프로젝트 등록하기 →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mx-auto max-w-3xl px-6 pt-24">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            FAQ
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            자주 묻는 질문
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-card border border-border bg-surface transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm text-foreground cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-5xl px-6 pt-24">
        <div
          className="rounded-[20px] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-hover"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)",
          }}
        >
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-black sm:text-4xl tracking-tight">
              당신의 멋진 사이드 프로젝트를 세상에 선보이세요
            </h2>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              첫 사용자를 만나 피드백을 받고, 함께할 동료를 찾으며 당신의 프로젝트를 키워보세요.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/projects/new"
                className="rounded-control bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-sm transition-transform hover:scale-105 cursor-pointer"
              >
                프로젝트 등록하기
              </Link>
              <Link
                href="/explore"
                className="rounded-control border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 cursor-pointer"
              >
                프로젝트 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
