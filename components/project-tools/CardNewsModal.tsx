"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Download, Image as ImageIcon, Sparkles, Check } from "lucide-react";
import { Project } from "@/lib/types";

interface CardNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function CardNewsModal({ isOpen, onClose, project }: CardNewsModalProps) {
  const [ratio, setRatio] = useState<"square" | "story">("square");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = ratio === "square" ? 1080 : 1080;
    const height = ratio === "square" ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#0a0f1d");
    grad.addColorStop(0.5, "#0f172a");
    grad.addColorStop(1, "#030712");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ambient glow
    const radial = ctx.createRadialGradient(width / 2, height / 3, 50, width / 2, height / 3, 500);
    radial.addColorStop(0, "rgba(56, 189, 248, 0.25)");
    radial.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // Top Brand Tag
    ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 130, 80, 260, 50, 25);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🚀 Featured on zemix", width / 2, 112);

    // Project Card
    const cardY = ratio === "square" ? 220 : 500;
    const cardH = 580;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "rgba(71, 85, 105, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(80, cardY, width - 160, cardH, 36);
    ctx.fill();
    ctx.stroke();

    // Project Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(project.title, width / 2, cardY + 160);

    // Tagline (wrapped)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "normal 30px sans-serif";
    const tagline = project.tagline || "";
    ctx.fillText(tagline.slice(0, 32), width / 2, cardY + 230);
    if (tagline.length > 32) {
      ctx.fillText(tagline.slice(32, 64), width / 2, cardY + 275);
    }

    // Stats bar
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
    ctx.beginPath();
    ctx.roundRect(140, cardY + 330, width - 280, 90, 20);
    ctx.fill();

    ctx.fillStyle = "#f43f5e";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(`❤️ ${project.likesCount || 0} Likes`, width / 2 - 160, cardY + 386);

    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`👀 ${project.viewsCount || 0} Views`, width / 2 + 160, cardY + 386);

    // Tags
    const tags = (project.tags || []).slice(0, 4);
    let startX = width / 2 - (tags.length * 110) / 2;
    tags.forEach((tag, idx) => {
      ctx.fillStyle = "rgba(51, 65, 85, 0.9)";
      ctx.beginPath();
      ctx.roundRect(startX + idx * 115, cardY + 460, 105, 45, 12);
      ctx.fill();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(tag, startX + idx * 115 + 52, cardY + 490);
    });

    // Bottom Watermark / CTA
    const botY = ratio === "square" ? 920 : 1600;
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("지금 zemix에서 둘러보고 응원해 주세요!", width / 2, botY);

    ctx.fillStyle = "#64748b";
    ctx.font = "normal 22px sans-serif";
    ctx.fillText("zemix.kr • 사이드 프로젝트 쇼케이스", width / 2, botY + 45);

    setDownloadUrl(canvas.toDataURL("image/png"));
  }, [isOpen, ratio, project]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">원클릭 SNS 카드뉴스 생성기 (OG Studio)</h3>
              <p className="text-xs text-muted">인스타그램, 스레드, X(트위터)에 바로 공유할 수 있는 이미지</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ratio Selector */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">포맷 선택:</span>
          <button
            onClick={() => setRatio("square")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              ratio === "square" ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-muted text-muted hover:text-foreground"
            }`}
          >
            정사각형 1:1 (피드 / 스레드 / X)
          </button>
          <button
            onClick={() => setRatio("story")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              ratio === "story" ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-muted text-muted hover:text-foreground"
            }`}
          >
            세로형 9:16 (인스타 스토리)
          </button>
        </div>

        {/* Canvas Preview Container */}
        <div className="mt-4 rounded-xl border border-border bg-slate-950 p-4 flex items-center justify-center max-h-[460px] overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-h-[420px] w-auto rounded-lg shadow-xl object-contain border border-slate-800"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted">고화질 PNG 이미지로 저장됩니다.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted hover:bg-surface-muted"
            >
              닫기
            </button>
            <a
              href={downloadUrl}
              download={`${project.title}_zemix_card.png`}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover shadow-md shadow-primary/20 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>이미지 다운로드 (.png)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
