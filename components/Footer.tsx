"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HexagonLogo } from "@/components/Icons";
import { Mail, CheckCircle2, Sparkles, Trophy, Rocket, Lightbulb } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    try {
      const existing = JSON.parse(localStorage.getItem("zemix_newsletter_subs") || "[]");
      existing.push({ email, date: new Date().toISOString() });
      localStorage.setItem("zemix_newsletter_subs", JSON.stringify(existing));
    } catch {}
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-border bg-surface-muted/50 py-12 mt-20 pb-24 md:pb-12">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Weekly Newsletter Section */}
        <div className="mb-10 rounded-2xl border border-border bg-surface p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-2">
              <Mail className="h-3.5 w-3.5" />
              <span>주간 큐레이션 뉴스레터</span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-foreground">
              매주 일요일 밤, 이번 주 TOP 5 프로젝트를 받아보세요
            </h3>
            <p className="text-xs md:text-sm text-muted mt-1">
              국내 인디 빌더들의 뜨거운 신규 런칭, 투표 랭킹, 실전 제작 팁을 메일함으로 바로 배달해 드립니다.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto items-center gap-2">
            {subscribed ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <span>구독 신청이 완료되었습니다! 🎉</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors w-full md:w-64"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  무료 구독
                </button>
              </>
            )}
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-surface border border-border text-foreground shadow-sm">
              <HexagonLogo className="h-4 w-4 text-foreground" strokeWidth={2.2} />
            </span>
            <span className="text-sm font-bold tracking-tight text-foreground">
              zemix
            </span>
            <span className="text-xs text-muted ml-2">
              — Meet users. Build together.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted">
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link href="/upcoming" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Rocket className="h-3 w-3 text-primary" />
              런칭 D-Day
            </Link>
            <Link href="/leaderboard" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-500" />
              명예의 전당
            </Link>
            <Link href="/perks" className="hover:text-foreground transition-colors text-primary font-semibold">
              🎁 혜택 몰
            </Link>
            <Link href="/templates" className="hover:text-foreground transition-colors">
              템플릿 샵
            </Link>
            <Link href="/challenges" className="hover:text-foreground transition-colors">
              월간 챌린지
            </Link>
            <Link href="/lounge" className="hover:text-foreground transition-colors">
              라이브 라운지
            </Link>
            <Link href="/ab-tests" className="hover:text-foreground transition-colors">
              A/B 투표
            </Link>
            <Link href="/collections" className="hover:text-foreground transition-colors">
              골든 컬렉션
            </Link>
            <Link href="/demoday" className="hover:text-foreground transition-colors">
              데모데이 엑스포
            </Link>
            <Link href="/wrapped" className="hover:text-foreground transition-colors text-amber-500 font-semibold">
              ✨ 2026 랩드
            </Link>
            <Link href="/ideas" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-emerald-500" />
              아이디어 묘지
            </Link>
            <Link href="/builders" className="hover:text-foreground transition-colors">
              Builders
            </Link>
            <Link href="/community" className="hover:text-foreground transition-colors">
              Community
            </Link>
            <Link href="/logos.html" className="hover:text-foreground transition-colors">
              브랜드 키트
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
          </div>

          <div className="text-xs text-muted-foreground text-center md:text-right">
            © 2026 Zemix. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
