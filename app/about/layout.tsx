import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개",
  description:
    "zemix는 사이드 프로젝트를 런칭하고 초기 유저를 만나 피드백과 동료를 구하는 메이커 커뮤니티 플랫폼입니다.",
  openGraph: {
    title: "서비스 소개 | zemix",
    description: "유저를 만나고, 함께 만드는 사이드 프로젝트 플랫폼 zemix 소개.",
    url: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
